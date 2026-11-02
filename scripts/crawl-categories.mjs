/* Finds crime cases through English Wikipedia's per-country crime categories ("Murder in India", "Kidnappings in
   Nigeria", ...). Many case articles have no type on Wikidata, so the Wikidata query alone misses them; this is
   what fills in the countries that Wikidata covers thinly. Used by scripts/build-library.mjs.

   It only collects candidates. Every safety rule is applied afterwards in build-library.mjs, plus the extra checks
   these pages need because Wikidata often knows nothing about them: their own Wikipedia categories are checked too. */

const API = 'https://en.wikipedia.org/w/api.php';
/* category families to start from, and the type each gives a case */
const ROOTS = [
  ['Category:Murder by country', /^Category:Murder in (.+)$/, 'Murder'],
  ['Category:Unsolved murders by country', /^Category:Unsolved murders in (.+)$/, 'Murder', 'Unsolved'],
  ['Category:Kidnappings by country', /^Category:Kidnappings in (.+)$/, 'Kidnapping'],
  ['Category:Robberies by country', /^Category:Robberies in (.+)$/, 'Robbery'],
  ['Category:Assassinations by country', /^Category:Assassinations in (.+)$/, 'Assassination'],
  ['Category:Arson by country', /^Category:Arson in (.+)$/, 'Arson']
];
/* subcategories never entered: people, works about crime, and the kinds of event the site leaves out */
const PRUNE = new RegExp([
  'people', 'victims', 'murderers', 'killers', 'perpetrators', 'criminals', 'convict', 'prisoners', 'assassins', 'robbers',
  'kidnappers', 'suspects', 'gangsters', 'mobsters', 'families',
  'films', 'television', 'books', 'novels', 'songs', 'albums', 'video games', 'fiction', 'plays', 'documentar', 'podcast',
  'massacre', 'mass murder', 'terror', 'riot', 'bomb', 'shooting', 'attack', 'pogrom', 'genocide', 'war crime', 'lynch',
  'insurgen', 'militan', 'communal', 'encounter', 'extrajudicial', 'execution', 'death squad', 'conflict', 'war ',
  'rape', 'sexual', 'femicide', 'child', 'infanticide', 'abuse', 'honour', 'honor', 'hostage', 'enforced disappearance',
  'law', 'legislation', 'organi[sz]ations', 'gangs', 'cartel', 'police', 'prisons', 'deaths', 'politic'
].join('|'), 'i');
const CATS_PER_ROOT = 40;   /* countries the library already covers well (the US, the UK, Japan, ...) */
const CATS_DEEP = 300;      /* countries with few cases: their category trees go five or six levels deep */
const PAUSE = 400; /* ms between requests: Wikipedia answers 429 to clients that go faster */

/* one request at a time, politely; on 429 or maxlag wait as long as asked (or longer each time) and try again */
let last = 0;
async function get(p, ua) {
  for (let i = 1; ; i++) {
    const wait = last + PAUSE - Date.now(); if (wait > 0) await new Promise(ok => setTimeout(ok, wait));
    last = Date.now();
    const r = await fetch(API + '?' + new URLSearchParams({ format: 'json', formatversion: 2, maxlag: 5, ...p }), { headers: { 'User-Agent': ua } });
    const j = r.ok ? await r.json().catch(() => null) : null;
    if (j && !j.error) return j;
    if (i >= 8) throw new Error(`Wikipedia API: ${r.status} ${j && j.error ? j.error.code : ''}`);
    const after = +(r.headers.get('retry-after') || 0);
    await new Promise(ok => setTimeout(ok, Math.max(after * 1000, 10000 * i)));
  }
}

/* thin: Set of country names to crawl deeply (those the Wikidata step found few cases for) */
export async function crawlCategories(ua, log = () => {}, thin = new Set()) {
  const members = async (title, type) => {
    const out = []; let cont = {};
    do {
      const j = await get({ action: 'query', list: 'categorymembers', cmtitle: title, cmtype: type, cmlimit: 500, ...cont }, ua);
      out.push(...(j.query ? j.query.categorymembers : [])); cont = j.continue || null;
    } while (cont);
    return out;
  };
  const found = new Map(); /* wikibase id → candidate */
  for (const [parent, re, k, status] of ROOTS) {
    const roots = (await members(parent, 'subcat')).map(m => m.title).filter(t => re.test(t) && !/ by |in (Africa|Asia|Europe|Oceania|the Americas|North America|South America|Latin America|the Middle East|the Caribbean)$/.test(t)).sort();
    for (const root of roots) {
      const country = re.exec(root)[1].replace(/^the /, '');
      const seen = new Set([root]); let queue = [root], visited = 0, before = found.size;
      const cap = thin.has(country) ? CATS_DEEP : CATS_PER_ROOT;
      while (queue.length && visited < cap) {
        const cat = queue.shift(); visited++;
        /* a year or decade in the category name dates the pages in it ("1990s murders in India" → up to 1999) */
        const ym = /\b(1[0-9]{3}|20[0-9]{2})(s?)\b/.exec(cat.replace(/^Category:/, ''));
        let cont = {};
        do {
          const j = await get({ action: 'query', generator: 'categorymembers', gcmtitle: cat, gcmlimit: 500,
            gcmtype: 'page|subcat', prop: 'pageprops', ppprop: 'wikibase_item', ...cont }, ua);
          const pages = (j.query ? j.query.pages : []).sort((a, b) => a.title.localeCompare(b.title));
          for (const p of pages) {
            if (p.ns === 14) { if (!seen.has(p.title) && !PRUNE.test(p.title)) { seen.add(p.title); queue.push(p.title) } continue } /* pages arrive sorted, so the queue stays in a fixed order */
            const q = p.ns === 0 && p.pageprops && p.pageprops.wikibase_item; if (!q) continue;
            const c = found.get(q) || { q, title: p.title, k, country, status };
            const tm = /^(1[5-9][0-9]{2}|20[0-9]{2})/.exec(p.title);
            if (tm) { const y = +tm[1]; c.yearHint = Math.min(c.yearHint ?? y, y); c.lastHint = Math.max(c.lastHint ?? y, y) }
            if (ym) {
              const y = +ym[1], last = ym[2] ? y + 9 : y;
              c.yearHint = Math.min(c.yearHint ?? y, y); c.lastHint = Math.max(c.lastHint ?? last, last);
            }
            if (status) c.status = status;
            found.set(q, c);
          }
          cont = j.continue || null;
        } while (cont);
      }
      log(`    ${root.replace('Category:', '')}: ${visited} categories, ${found.size - before} new pages`);
    }
    log(`  ${parent}: ${roots.length} countries, ${found.size} candidate pages so far`);
  }
  return found;
}

/* every (visible) category of each page, for the safety check: titles → Map(title → "cat names joined") */
export async function pageCategories(titles, ua) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    let cont = {};
    do {
      const j = await get({ action: 'query', prop: 'categories', clshow: '!hidden', cllimit: 'max',
        titles: titles.slice(i, i + 50).join('|'), ...cont }, ua);
      for (const p of (j.query ? j.query.pages : [])) {
        const prev = out.get(p.title) || '';
        out.set(p.title, prev + ' ' + (p.categories || []).map(c => c.title.replace(/^Category:/, '')).join(' | '));
      }
      cont = j.continue || null;
    } while (cont);
  }
  return out;
}

/* years named in the first two sentences of each article, for pages with no date anywhere else:
   titles → Map(title → [first year, last year]). Only plausible years (1500 to this year) count. */
export async function leadYears(titles, ua) {
  const out = new Map(), now = new Date().getUTCFullYear();
  for (let i = 0; i < titles.length; i += 20) {
    const j = await get({ action: 'query', prop: 'extracts', exintro: 1, explaintext: 1, exsentences: 2, exlimit: 20,
      titles: titles.slice(i, i + 20).join('|') }, ua);
    for (const p of (j.query ? j.query.pages : [])) {
      const ys = (String(p.extract || '').match(/\b(1[5-9][0-9]{2}|20[0-9]{2})\b/g) || []).map(Number).filter(y => y <= now);
      if (ys.length) out.set(p.title, [Math.min(...ys), Math.max(...ys)]);
    }
  }
  return out;
}
