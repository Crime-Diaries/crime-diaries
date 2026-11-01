/* Builds data/library.js: an index of crime cases that have a Wikipedia article in any language, from Wikidata.
   Run: node scripts/build-library.mjs   (Node 18+, no dependencies)
   A GitHub Action runs this nightly (.github/workflows/library.yml), so the site stays fresh without a server.

   Safety rules applied here, from docs/research.md:
   - Only events that ended at least MIN_AGE years ago (most active trials and recent victims are left out).
     Undated items are dropped.
   - Mass-casualty attacks are left out on purpose: detailed coverage of them is linked to copycat attacks, and this
     site must never inspire one. Three layers: excluded classes (and their subclasses), four or more deaths
     (except serial murder, which is spread over years), and a text check on the title and description.
   - We add no offender data and no images. Titles and descriptions come from Wikidata and may still name people.
     Coordinates are coarse (town level, never a house).
   Wikidata is CC0. Wikipedia text is fetched live by the browser and credited there (CC BY-SA). */
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { crawlCategories, pageCategories, leadYears } from './crawl-categories.mjs';

const MIN_AGE = 10;
const UA = 'CrimeDiariesBuild/0.1 (https://github.com/preetsaini2004/crime-diaries; educational encyclopedia)';
const OUT = new URL('../data/library.js', import.meta.url);

/* Wikidata class → type shown on the site. IDs checked against the Wikidata API on 2026-10-30. */
const CLASSES = {
  Q132821: 'Murder', Q149086: 'Murder', Q19393843: 'Murder', Q16266378: 'Serial murder',
  Q3882219: 'Assassination', Q51159762: 'Poisoning', Q318296: 'Kidnapping',
  Q7884274: 'Disappearance', Q53706: 'Robbery', Q806824: 'Robbery', Q7832904: 'Robbery',
  Q1756454: 'Theft', Q2727213: 'Theft', Q28813: 'Fraud & forgery', Q1332286: 'Fraud & forgery',
  Q502918: 'Fraud & forgery', Q327541: 'Arson'
};
const UNSOLVED = new Set(['Q19393843', 'Q7884274']);
/* SENSITIVE cases are included but flagged, and the site shows them only behind a content warning (js/sensitive.js).
   These Wikidata classes (and all their subclasses) are sensitive; the value is the type shown on the site.
   Sexual-violence ones are also PROTECTED: no victim identity is published (see protect() below). */
const SENSITIVE = {
  Q2223653: 'Terror attack', Q217327: 'Terror attack', Q6813020: 'Terror attack', Q18711682: 'Terror attack', Q7283: 'Terror attack',
  Q891854: 'Bombing', Q21480300: 'Mass shooting', Q473853: 'School shooting', Q750215: 'Mass killing', Q66975460: 'Mass killing',
  Q5400895: 'Mass killing', Q3199915: 'Massacre', Q124757: 'Riot', Q177716: 'Riot', Q5153967: 'Riot', Q486775: 'Lynching',
  Q47092: 'Sexual violence', Q8192354: 'Sexual violence'
};
const SEXUAL_CLASSES = new Set(['Q47092', 'Q8192354']);
const MAX_DEATHS = 3; /* more than this and the event counts as mass-casualty (serial murder exempt) */
/* checked against the English label and description AND the local-language Wikipedia title, so it covers the main
   languages too (Spanish, Portuguese, French, German, Italian, Dutch, Polish, Turkish, Russian, Japanese, Chinese, Arabic,
   Hebrew, Korean) */
const UNSAFE_LIST = [
  'terror', 'massacre', 'mass (murder|shooting|killing|kidnapping|stabbing)', 'bomb', 'suicide attack', 'spree', 'rampage',
  'jihad', 'intifada', 'militant', 'insurgen', 'attack on', 'attacks? in', 'attacks against', 'multiple shooting',
  'explosive', 'ramming',
  'atentado', 'masacre', 'matanza', 'tiroteo', 'chacina', 'tuerie', 'fusillade', 'anschlag', 'amoklauf', 'massaker',
  'strage', 'attentato', 'bloedbad', 'aanslag', 'zamach', 'masakra', 'katliam', 'saldırı',
  'теракт', 'массов', 'бойня', 'расстрел', 'взрыв',
  'テロ', '乱射', '大量殺人', '虐殺', '爆破', '屠杀', '恐怖', '爆炸', '枪击',
  '殺傷', '通り魔', '無差別', '殺人事件.*人死亡',
  'פיגוע', 'מחבל', 'טבח', '테러', '학살', '난사', '묻지마',
  'مجزرة', 'هجوم', 'تفجير', 'إرهاب'
];
const UNSAFE_TEXT = new RegExp(UNSAFE_LIST.join('|'), 'iu');
/* on category names, "attacks in" also matches harmless ones ("Stabbing attacks in India"), so those phrases are
   checked on titles and descriptions only; "Terrorist attacks in ..." is still caught by "terror" */
const UNSAFE_CATS = new RegExp(UNSAFE_LIST.filter(w => !/^attack/.test(w)).join('|'), 'iu');
/* Wikipedia edition used when a case has no English article: the first of these that exists, else alphabetical */
const LANG_PREF = ['es', 'fr', 'de', 'pt', 'it', 'ru', 'ja', 'zh', 'ar', 'pl', 'nl', 'sv', 'ko', 'tr', 'id', 'uk', 'fa', 'he',
  'hi', 'cs', 'fi', 'no', 'da', 'hu', 'ro', 'el', 'vi', 'th'];
/* Sexual-offence cases are PROTECTED. Many countries make it a crime to identify a victim, even indirectly
   (India: BNS s.72, formerly IPC s.228A; UK: Sexual Offences (Amendment) Act 1992), whatever the reader agreed to. */
const SEXUAL = new RegExp([
  '\\brap(e|ed|es|ing|ist|ists)\\b', 'gang-?rape', 'sexual (assault|abuse|offen|violence|crime)', 'molest', 'pocso',
  'violaci[oó]n', 'violada', 'estupro', '\\bviol\\b', 'vergewaltig', 'sexualmord', 'stupro', 'verkracht', 'gwałt',
  'изнасил', '強姦', '強制性交', '性的暴行', '强奸', '性侵', 'اغتصاب', 'אונס', '강간', '성폭행', 'बलात्कार'
].join('|'), 'iu');
/* India's Juvenile Justice Act (s.74) forbids identifying a child in a case, as offender, victim or witness: PROTECTED */
const CHILD_IN = { India: /\b(child|children|minor|juvenile|girl|boy|schoolgirl|schoolboy|teen|teenage|teenager|infant|baby|student)s?\b|pocso|बच्चे|बालिका/iu };
/* extra check for cases found through categories, whose Wikidata entry often has no type at all */
const CRAWL_UNSAFE = /riot|lynch|pogrom|communal|encounter killing|custodial|extrajudicial|honou?r killing|mob /i;
/* types a category-found page may have (besides none, or one in CLASSES): criminal case, legal case,
   deliberate murder, occurrence, incident. Any other type (person, film, riot, war, accident, ...) is refused. */
const EXTRA_OK = new Set(['Q16738832', 'Q2334719', 'Q4676786', 'Q1190554', 'Q12890393']);
/* a category-found page with no Wikidata type must look like a case by its title or description, and not like a
   book, film, report, inquiry, speech, law or a wave of unrest */
const CASE_LIKE = /murder|killing|killed|assassinat|kidnap|abduct|robbery|robber|heist|theft|stolen|fraud|scam|swindle|forgery|counterfeit|poison|disappear|missing|arson|\bcase\b|death of|homicide|shooting of|stabbing of|ransom|embezzle|extortion|smuggl|hijack|massacre|riot|attack|bombing|lynching|rape/i;
const NOT_CASE = /commission|inquiry|\breport\b|speech|\bbook\b|novel|\bfilm\b|documentary|\bact\b|\blaw\b|\bbill\b|unrest|protest|agitation|movement|uprising|clashes|conflict|\bwar\b|operation |the truth|list of|timeline|trial of|controversy/i;
const PER_COUNTRY = 250; /* most cases one country can add through categories */

/* manual removals: entries reviewed as unsuitable, or removed at someone's request. Add the Wikidata id and a reason. */
const REMOVED = {};

const cutoff = new Date().getUTCFullYear() - MIN_AGE;
const ids = list => list.map(q => 'wd:' + q).join(' ');
async function sparqlOnce(query) {
  /* POST: the excluded-class list makes the query too long for a URL */
  const res = await fetch('https://query.wikidata.org/sparql', {
    method: 'POST', body: new URLSearchParams({ query }),
    headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA }
  });
  if (!res.ok) throw Object.assign(new Error(`Wikidata answered ${res.status}: ${(await res.text()).slice(0, 300)}`), { status: res.status });
  return (await res.json()).results.bindings;
}
/* the public endpoint times out now and then (504); try up to 4 times, waiting longer each time */
async function sparql(query) {
  for (let i = 1; ; i++) {
    try { return await sparqlOnce(query) } catch (e) {
      if (i >= 4 || (e.status >= 400 && e.status < 500 && e.status !== 429)) throw e; /* a bad query never succeeds on retry */
      console.warn(`${e.message.split(String.fromCharCode(10))[0]}; retrying in ${15 * i}s`);
      await new Promise(r => setTimeout(r, 15000 * i));
    }
  }
}
/* step 1: the sensitive classes and all their subclasses, each mapped to its root's type
   (walking subclasses inside the main query times out) */
const SENS_K = {}, SENS_SEXUAL = new Set();
for (const r of await sparql(`SELECT DISTINCT ?c ?root WHERE { VALUES ?root { ${ids(Object.keys(SENSITIVE))} } ?c wdt:P279* ?root . } ORDER BY ?c ?root`)) {
  const c = r.c.value.split('/').pop(), root = r.root.value.split('/').pop();
  if (!/^Q[0-9]+$/.test(c) || CLASSES[c]) continue;
  if (SEXUAL_CLASSES.has(root)) { SENS_SEXUAL.add(c); SENS_K[c] = SENSITIVE[root] } else if (!SENS_K[c]) SENS_K[c] = SENSITIVE[root];
}
const banned = Object.keys(SENS_K).sort(); /* old name kept: these classes now flag a case as sensitive, never drop it */
const KIND = q => CLASSES[q] || SENS_K[q];
/* step 2: the cases (kept small and fast: the public endpoint stops at 60 seconds) */
const v = (r, k) => r[k] && r[k].value;
const qid = (r, k) => v(r, k).split('/').pop();
const rows = await sparql(`
SELECT ?item ?cls ?label ?mul ?desc ?t ?end ?deaths WHERE {
  VALUES ?cls { ${ids([...Object.keys(CLASSES), ...banned])} }
  ?item wdt:P31 ?cls .
  ?item wikibase:sitelinks ?sl . FILTER(?sl > 0)
  ?item wdt:P585|wdt:P580 ?t .
  OPTIONAL { ?item wdt:P582 ?end }
  OPTIONAL { ?item wdt:P1120 ?deaths }
  OPTIONAL { ?item rdfs:label ?label . FILTER(lang(?label) = 'en') }
  OPTIONAL { ?item rdfs:label ?mul . FILTER(lang(?mul) = 'mul') }
  OPTIONAL { ?item schema:description ?desc . FILTER(lang(?desc) = 'en') }
} ORDER BY ?item ?cls ?t`); /* fixed order everywhere, so the same data gives the same file */

const point = (wkt, dp) => {
  const m = /Point\(([-\d.eE]+) ([-\d.eE]+)\)/.exec(wkt || ''); if (!m) return null;
  const f = 10 ** dp; return [Math.round(+m[2] * f) / f, Math.round(+m[1] * f) / f];
};
const byId = new Map();
for (const r of rows) {
  const q = qid(r, 'item'), cls = qid(r, 'cls');
  const y = parseInt(v(r, 't'), 10); if (!Number.isFinite(y)) continue;
  let e = byId.get(q);
  if (!e) byId.set(q, e = { q, t: v(r, 'label') || v(r, 'mul') || '', d: v(r, 'desc') || '', y, k: KIND(cls) });
  if (CLASSES[cls]) e.k = CLASSES[cls]; /* a crime type beats a sensitive one ("Murder" over "Riot") */
  if (SENS_SEXUAL.has(cls)) e.sexual = 1; else if (SENS_K[cls]) e.attack = 1;
  e.y = Math.min(e.y, y);
  const end = parseInt(v(r, 'end'), 10); e.last = Math.max(e.last || y, y, Number.isFinite(end) ? end : y);
  const deaths = parseInt(v(r, 'deaths'), 10); if (Number.isFinite(deaths)) e.deaths = Math.max(e.deaths || 0, deaths);
  if (cls === 'Q16266378') e.serial = 1;
  if (UNSOLVED.has(cls)) e.s = 'Unsolved';
}
/* manual additions: well-known cases that Wikidata types wrongly, so the class query misses them.
   Wikidata id → [the class to treat it as, 'attack' to flag it sensitive]. Checked by hand; keep it short. */
const ADDED = {
  Q3535523: ['Q327541', 'attack'] /* Godhra train burning (2002): typed only as "railway accident" */
};
for (const r of await sparql(`SELECT ?item ?label ?mul ?desc ?t ?end ?deaths WHERE {
  VALUES ?item { ${ids(Object.keys(ADDED))} }
  ?item wdt:P585|wdt:P580 ?t .
  OPTIONAL { ?item wdt:P582 ?end }
  OPTIONAL { ?item wdt:P1120 ?deaths }
  OPTIONAL { ?item rdfs:label ?label . FILTER(lang(?label) = 'en') }
  OPTIONAL { ?item rdfs:label ?mul . FILTER(lang(?mul) = 'mul') }
  OPTIONAL { ?item schema:description ?desc . FILTER(lang(?desc) = 'en') }
} ORDER BY ?item ?t`)) {
  const q = qid(r, 'item'), [cls, flag] = ADDED[q], y = parseInt(v(r, 't'), 10);
  if (byId.has(q) || !Number.isFinite(y)) continue;
  const end = parseInt(v(r, 'end'), 10), deaths = parseInt(v(r, 'deaths'), 10);
  byId.set(q, { q, t: v(r, 'label') || v(r, 'mul') || '', d: v(r, 'desc') || '', y, k: KIND(cls), last: Number.isFinite(end) ? Math.max(y, end) : y,
    ...(flag === 'attack' && { attack: 1 }), ...(Number.isFinite(deaths) && { deaths }) });
}

/* step 2b: cases found through English Wikipedia's per-country crime categories (scripts/crawl-categories.mjs) */
console.log('Crawling Wikipedia crime categories…');
/* CRAWL_CACHE=1 reuses the last crawl (cache/crawl.json, not committed): handy while tuning the filters locally */
const CACHE = new URL('../cache/crawl.json', import.meta.url);
let crawl;
if (process.env.CRAWL_CACHE) { try { crawl = new Map(JSON.parse(await readFile(CACHE, 'utf8'))); console.log('  (crawl from cache)') } catch {} }
if (!crawl) {
  /* countries with fewer than 100 cases from Wikidata get a deep crawl */
  /* (counted from the previous library file: cases get their country only in step 3) */
  const perC = {};
  try {
    const prev = JSON.parse(/window\.LIBRARY = (\{.*\});/.exec(await readFile(OUT, 'utf8'))[1]);
    for (const e of prev.items) perC[e.c] = (perC[e.c] || 0) + 1;
  } catch {}
  const known = new Set(Object.entries(perC).filter(([, n]) => n >= 100).map(([c]) => c));
  const thin = { has: c => !known.has(c) && !known.has(c.replace(/^the /, '')) };
  crawl = await crawlCategories(UA, console.log, thin);
  await mkdir(new URL('../cache/', import.meta.url), { recursive: true }).catch(() => {});
  await writeFile(CACHE, JSON.stringify([...crawl])).catch(() => {});
}
const fresh = [...crawl.keys()].filter(q => !byId.has(q)).sort();
const info = new Map();
for (let i = 0; i < fresh.length; i += 300) {
  for (const r of await sparql(`SELECT ?item ?inst ?t ?end ?deaths ?label ?desc WHERE { VALUES ?item { ${ids(fresh.slice(i, i + 300))} }
      OPTIONAL { ?item wdt:P31 ?inst } OPTIONAL { ?item wdt:P585|wdt:P580 ?t } OPTIONAL { ?item wdt:P582 ?end }
      OPTIONAL { ?item wdt:P1120 ?deaths }
      OPTIONAL { ?item rdfs:label ?label . FILTER(lang(?label) = 'en') }
      OPTIONAL { ?item schema:description ?desc . FILTER(lang(?desc) = 'en') }
    } ORDER BY ?item ?inst ?t ?end ?deaths ?label ?desc`)) {
    const q = qid(r, 'item'), o = info.get(q) || info.set(q, { inst: new Set() }).get(q);
    if (v(r, 'inst')) o.inst.add(qid(r, 'inst'));
    const y = parseInt(v(r, 't'), 10), end = parseInt(v(r, 'end'), 10), deaths = parseInt(v(r, 'deaths'), 10);
    if (Number.isFinite(y)) { o.y = Math.min(o.y ?? y, y); o.last = Math.max(o.last ?? y, y) }
    if (Number.isFinite(end)) o.last = Math.max(o.last ?? end, end);
    if (Number.isFinite(deaths)) o.deaths = Math.max(o.deaths || 0, deaths);
    if (!o.label && v(r, 'label')) o.label = v(r, 'label');
    if (!o.desc && v(r, 'desc')) o.desc = v(r, 'desc');
  }
}
const crawlDrop = { type: 0, undated: 0 };
/* pages with no date on Wikidata or in a category or title: take the years named in the article's first two sentences */
const typeOk = q => [...((info.get(q) || {}).inst || [])].every(x => KIND(x) || EXTRA_OK.has(x));
const noDate = fresh.filter(q => { const o = info.get(q); return typeOk(q) && (!o || o.y == null) && crawl.get(q).yearHint == null }).map(q => crawl.get(q).title).sort();
const leads = await leadYears(noDate, UA);
console.log(`  dates read from ${leads.size} of ${noDate.length} undated articles`);
const NOT_COUNTRY = / by |^(Africa|Asia|Europe|Oceania|the Americas|North America|South America|Latin America|the Middle East|the Caribbean|Antarctica|the world)$/i;
for (const q of fresh) {
  const c = crawl.get(q), o = info.get(q) || { inst: new Set() };
  const cc = NOT_COUNTRY.test(c.country) ? '' : c.country; /* reached through a continent category: country comes from Wikidata */
  if (![...o.inst].every(x => KIND(x) || EXTRA_OK.has(x))) { crawlDrop.type++; continue }
  const named = `${o.label || c.title} ${o.desc || ""}`;
  if (![...o.inst].some(x => KIND(x)) && (!CASE_LIKE.test(named) || NOT_CASE.test(named))) { crawlDrop.notcase = (crawlDrop.notcase || 0) + 1; continue }
  const ly = leads.get(c.title);
  const y = o.y ?? c.yearHint ?? (ly && ly[0]); if (y == null) { crawlDrop.undated++; continue }
  const k = [...o.inst].map(x => CLASSES[x]).find(Boolean) || [...o.inst].map(x => SENS_K[x]).find(Boolean) || c.k;
  byId.set(q, { q, t: o.label || c.title, d: o.desc || '', y, k, last: Math.max(o.last ?? y, c.lastHint ?? y, ly ? ly[1] : y),
    ...(o.deaths != null && { deaths: o.deaths }), ...(o.inst.has('Q16266378') && { serial: 1 }),
    ...(c.status && { s: c.status }), ...([...o.inst].some(x => SENS_SEXUAL.has(x)) && { sexual: 1 }),
    ...([...o.inst].some(x => SENS_K[x] && !SENS_SEXUAL.has(x)) && { attack: 1 }), cc, crawled: 1 });
}
console.log(`  categories: ${crawl.size} pages, ${fresh.length} new, ${[...byId.values()].filter(e => e.crawled).length} kept so far; refused ${JSON.stringify(crawlDrop)}`);

/* step 3: per batch of 400 cases, every type (to drop excluded classes), the place, and the Wikipedia articles */
const qs = [...byId.keys()].sort();
const bannedSet = new Set(banned);
const links = new Map();
for (let i = 0; i < qs.length; i += 400) {
  const batch = ids(qs.slice(i, i + 400));
  for (const r of await sparql(`SELECT ?item ?inst WHERE { VALUES ?item { ${batch} } ?item wdt:P31 ?inst . }`))
    if (bannedSet.has(qid(r, 'inst'))) { const e = byId.get(qid(r, 'item')); if (SENS_SEXUAL.has(qid(r, 'inst'))) e.sexual = 1; else e.attack = 1 }
  for (const r of await sparql(`SELECT ?item ?country ?place ?pc ?c ?lc WHERE { VALUES ?item { ${batch} }
      OPTIONAL { ?item wdt:P17 ?co . ?co rdfs:label ?country . FILTER(lang(?country) = 'en') }
      OPTIONAL { ?item wdt:P131 ?adm . ?adm rdfs:label ?place . FILTER(lang(?place) = 'en') OPTIONAL { ?adm wdt:P625 ?pc } }
      OPTIONAL { ?item wdt:P625 ?c }
      OPTIONAL { ?item wdt:P276 ?loc . ?loc wdt:P625 ?lc }
    } ORDER BY ?item ?country ?place ?pc ?c ?lc`)) {
    const e = byId.get(qid(r, 'item'));
    if (!e.c && v(r, 'country')) e.c = v(r, 'country');
    if (!e.p && v(r, 'place')) e.p = v(r, 'place');
    /* town-level coordinates first (2 dp ≈ 1 km, of a whole town); the event's own point only rounded to 1 dp ≈ 11 km */
    if (!e.ll || e.llOwn) { const town = point(v(r, 'pc'), 2); if (town) { e.ll = town; delete e.llOwn } }
    if (!e.ll) { const own = point(v(r, 'c'), 1) || point(v(r, 'lc'), 1); if (own) { e.ll = own; e.llOwn = 1 } }
  }
  for (const r of await sparql(`SELECT ?item ?wiki ?name WHERE { VALUES ?item { ${batch} }
      ?a schema:about ?item ; schema:isPartOf ?wiki ; schema:name ?name . FILTER(STRENDS(STR(?wiki), '.wikipedia.org/')) }`)) {
    const q = qid(r, 'item'), lang = new URL(v(r, 'wiki')).hostname.split('.')[0];
    if (lang === 'simple') continue;
    (links.get(q) || links.set(q, []).get(q)).push([lang, v(r, 'name')]);
  }
}
const rank = l => l === 'en' ? -1 : LANG_PREF.includes(l) ? LANG_PREF.indexOf(l) : 100;
for (const [q, e] of byId) {
  const ls = (links.get(q) || []).sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]));
  if (!ls.length) { byId.delete(q); continue }
  const [lang, name] = ls[0];
  e.w = name.replace(/ /g, '_'); if (lang !== 'en') e.l = lang;
  e.local = ls.map(x => x[1]).join(' '); /* every edition's title, for the safety check below */
  if (!e.t) e.t = name;
  if (!e.c && e.cc) e.c = e.cc; /* country from the category when Wikidata has none */
}

/* step 4: the Wikipedia categories of every English article, so the safety checks see more than the title */
const enTitles = [...byId.values()].filter(e => !e.l && e.w).map(e => e.w.replace(/_/g, ' ')).sort();
const cats = await pageCategories(enTitles, UA);
for (const e of byId.values()) if (!e.l && e.w) e.cats = cats.get(e.w.replace(/_/g, ' ')) || '';

const dropped = { removed: 0, recent: 0, cap: 0 };
const flagged = { attack: 0, sexual: 0, child: 0 };
const perCountry = {};
const log = [];
const why = (e, r, re, all) => { if (process.env.DROP_LOG) log.push([e.q, r, e.crawled ? 'cat' : 'wd', e.c || e.cc || '', e.t, re ? String(all.match(re)) : '', e.attack ? 'attack-class' : '', e.deaths || 0]) };
/* Every case is either dropped (removed on request, or too recent: proceedings may still be active), or kept and,
   when sensitive, flagged: x = 'attack' (terror, massacre, riot, mass killing, lynching ...), 'sexual' or 'child'.
   Sexual and child cases are PROTECTED: see protect(). */
const kept = [...byId.values()].sort((a, b) => a.q.localeCompare(b.q)).filter(e => {
  const all = `${e.t} ${e.d} ${e.local} ${e.cats || ''}`, own = `${e.t} ${e.d} ${e.local}`;
  if (REMOVED[e.q]) return !++dropped.removed;
  if (e.last > cutoff) return why(e, 'recent'), !++dropped.recent;
  if (e.sexual || SEXUAL.test(all)) { e.x = 'sexual'; why(e, 'sexual', SEXUAL, all) }
  else if (CHILD_IN[e.c] && CHILD_IN[e.c].test(all)) { e.x = 'child'; why(e, 'child', CHILD_IN[e.c], all) }
  else if (e.attack || (!e.serial && e.deaths > MAX_DEATHS) || UNSAFE_TEXT.test(own) || UNSAFE_CATS.test(e.cats || '')
    || (e.crawled && CRAWL_UNSAFE.test(all))) { e.x = 'attack'; why(e, 'attack', UNSAFE_TEXT, all) }
  if (e.x) flagged[e.x]++;
  if (e.crawled && !e.x && (perCountry[e.c] = (perCountry[e.c] || 0) + 1) > PER_COUNTRY) return !++dropped.cap;
  return true;
});
/* PROTECTED cases keep nothing that could identify a victim, even indirectly: no title, description, Wikipedia page
   name or place below the country; the location is rounded to whole degrees (about 100 km). The page fetches the rest
   live, and only after the reader has accepted the content warning. */
const KIND_NAME = { sexual: 'Sexual-violence case', child: 'Case involving a child' };
function protect(e) {
  const o = { q: e.q, t: `${KIND_NAME[e.x]}, ${e.c || 'country not recorded'}, ${e.y}`, y: e.y,
    k: e.x === 'sexual' ? 'Sexual violence' : e.k, x: e.x };
  if (e.c) o.c = e.c;
  if (e.l) o.l = e.l; /* the language code only, so the page can open the right Wikipedia (Special:GoToLinkedPage) */
  if (e.ll) o.ll = [Math.round(e.ll[0]), Math.round(e.ll[1])];
  return o;
}
const clean = ({ llOwn, last, deaths, serial, local, banned, cats, cc, crawled, sexual, attack, ...e }) => e;
const order = (a, b) => a.y - b.y || a.t.localeCompare(b.t) || a.q.localeCompare(b.q);
const items = kept.filter(e => !e.x).map(clean).sort(order);
const sensitive = kept.filter(e => e.x).map(e => e.x === 'attack' ? clean(e) : protect(e)).sort(order);

/* sanity checks: a broken query or parser should fail the nightly job, not publish an empty library */
const share = k => items.filter(e => e[k]).length / items.length;
if (items.length < 500 || share('ll') < 0.3 || share('c') < 0.5)
  throw new Error(`Library looks wrong: ${items.length} cases, ${(share('ll') * 100).toFixed(0)}% with a location, ${(share('c') * 100).toFixed(0)}% with a country. Not writing it.`);

const updated = new Date().toISOString().slice(0, 10);
const js = `/* Generated by scripts/build-library.mjs. Do not edit by hand: the nightly build overwrites it.
   Source: Wikidata (CC0). Keys: q Wikidata id, t title (English when Wikidata has one), w Wikipedia page,
   l language of that page when not English (e.g. 'ja' means ja.wikipedia.org), d English description, y year,
   k type, s status (only when Wikidata records it as unsolved), c country, p place, ll [lat,lng] town-level. */
window.LIBRARY_UPDATED = '${updated}'; // date of the last change in the data (own line, so the nightly build can ignore it)
window.LIBRARY = ${JSON.stringify({ cutoff, count: items.length, items })};
`;
const jsx = `/* Generated by scripts/build-library.mjs. Do not edit by hand. SENSITIVE cases, shown only behind a content warning.
   Same keys as library.js, plus x: 'attack' (terror, massacre, riot, mass killing, lynching), 'sexual' or 'child'.
   'sexual' and 'child' cases are protected: neutral title, country only, location rounded to whole degrees. */
window.LIBRARY_SENSITIVE = ${JSON.stringify({ count: sensitive.length, items: sensitive })};
`;
if (process.env.DROP_LOG) await writeFile(new URL('../cache/drops.json', import.meta.url), JSON.stringify(log, null, 0));
await writeFile(OUT, js);
await writeFile(new URL('../data/sensitive.js', import.meta.url), jsx);
console.log(`library.js: ${items.length} cases up to ${cutoff}, ${(js.length / 1024).toFixed(0)} KB; sensitive.js: ${sensitive.length} cases, ${(jsx.length / 1024).toFixed(0)} KB ${JSON.stringify(flagged)}. Dropped: ${JSON.stringify(dropped)}; ${banned.length} sensitive classes`);
