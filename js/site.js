/* Page logic for the home page (#grid) and the case page (#article). Data comes from data/cases.js. */
(()=>{
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decade=c=>Math.floor(c.year/10)*10+'s';
const pad=n=>String(n).padStart(3,'0');
const store={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
const eyes=()=>Eye.all;
const say=html=>{const el=$('eye-line');if(el)el.innerHTML=html};

/* ---------- intro: only when the visitor asks for it (the notice, ?intro, or the Replay button in js/chrome.js) ---------- */
function runIntro(withSound){
  const box=$('intro');if(!box||!window.playIntro)return;
  box.hidden=false;box.classList.remove('out');document.body.classList.add('intro-on');scrollTo(0,0);
  let skip;const done=()=>{store.set('cd_intro_seen','1');box.classList.add('out');document.body.classList.remove('intro-on');
    setTimeout(()=>{box.hidden=true},900);$('skip').onclick=null;eyes().forEach(e=>e.blink())};
  skip=playIntro(done,{sound:withSound});$('skip').onclick=()=>skip();
  let snd=!!withSound;const lab=()=>{$('snd').textContent=snd?'SOUND ON':'SOUND OFF';$('snd').setAttribute('aria-pressed',snd)};lab();
  $('snd').onclick=()=>{snd=!snd;skip.sound(snd);lab()};
}
CD.runIntro=runIntro;

/* ---------- home page ---------- */
if($('grid')){
  const hero=Eye.create($('hero-eye'),{fill:innerWidth<640?.95:.6,cy:.36});
  if(matchMedia('(pointer: coarse)').matches)say('The Eye is watching. Tap anywhere.');
  /* the notice comes first; the intro never plays by itself, the visitor opts in */
  CD.gate(choice=>{if(choice==='intro'||(choice===null&&new URLSearchParams(location.search).has('intro')))runIntro()},{intro:true});

  const F={country:$('f-country'),decade:$('f-decade'),type:$('f-type'),status:$('f-status')};
  const label={country:'All countries',decade:'All decades',type:'All crime types',status:'Solved & unsolved'};
  for(const k in F){
    const vals=[...new Set(CASES.map(c=>k==='decade'?decade(c):c[k]))].sort();
    F[k].innerHTML=`<option value="">${label[k]}</option>`+vals.map(v=>`<option>${esc(v)}</option>`).join('');
    F[k].onchange=render;
  }
  const q=$('q');
  const fname=id=>(FORENSICS.find(f=>f.id===id)||{}).name||id;
  const hay=c=>[c.title,c.aka,c.country,c.place,c.type,c.status,c.year,c.summary,...c.tags.map(fname)].join(' ').toLowerCase();

  function render(){
    const term=q.value.trim().toLowerCase();
    const list=CASES.filter(c=>(!F.country.value||c.country===F.country.value)&&(!F.decade.value||decade(c)===F.decade.value)
      &&(!F.type.value||c.type===F.type.value)&&(!F.status.value||c.status===F.status.value)&&(!term||hay(c).includes(term)));
    $('count').textContent=`${list.length} of ${CASES.length} case files`;
    $('grid').innerHTML=list.length?list.map(c=>`<a class="card" href="case.html?id=${c.id}" data-id="${c.id}">
      <span class="no">CASE #${pad(c.no)} · ${c.year}</span><h3>${esc(c.title)}</h3>${c.aka?`<p class="aka">${esc(c.aka)}</p>`:''}
      <p class="sum">${esc(c.summary)}</p>
      <div class="meta"><span class="st ${c.status}">${c.status.toUpperCase()}</span><span class="chip">${esc(c.country)}</span><span class="chip">${esc(c.type)}</span></div></a>`).join('')
      :`<div class="empty">Nothing in the records matches that. Try fewer filters.</div>`;
    if(term)say(list.length?`The Eye found <b>${list.length}</b> file${list.length>1?'s':''} for “${esc(q.value.trim())}”.`:`Nothing in the records for “${esc(q.value.trim())}”.`);
  }
  render();

  /* the Eye reacts to what you do */
  q.addEventListener('focus',()=>{eyes().forEach(e=>e.squint(true));say('The Eye narrows. <b>Searching…</b>')});
  q.addEventListener('blur',()=>eyes().forEach(e=>e.squint(false)));
  q.addEventListener('input',render);
  $('search').onsubmit=e=>{e.preventDefault();q.blur();$('cases').scrollIntoView()};
  const grid=$('grid');
  const onCard=e=>{const a=e.target.closest('.card');if(!a)return;const c=CASES.find(x=>x.id===a.dataset.id);
    eyes().forEach(i=>i.interest(true));say(`The Eye is looking at <b>${esc(c.title)}</b>.`);
    if(e.type==='focusin'){const r=a.getBoundingClientRect();hero.lookAt({x:r.left+r.width/2,y:r.top+r.height/2})}};
  const offCard=e=>{if(e.relatedTarget&&e.relatedTarget.closest&&e.relatedTarget.closest('.card'))return;eyes().forEach(i=>{i.interest(false);i.lookAt(null)})};
  grid.addEventListener('pointerover',onCard);grid.addEventListener('focusin',onCard);
  grid.addEventListener('pointerout',offCard);grid.addEventListener('focusout',offCard);

  /* the library teaser: counts per type and six "cases of the day" (same six all day, new ones tomorrow) */
  if(window.LIBRARY&&$('lib-pick')){
    const L=CD.items(),by={};L.forEach(e=>by[e.k]=(by[e.k]||0)+1);
    $('lib-line').innerHTML=`<b>${L.length.toLocaleString('en')}</b> more cases from Wikipedia and Wikidata, imported automatically (last updated ${esc(window.LIBRARY_UPDATED||'')}). These are <b>not reviewed</b> by Crime Diaries.`;
    $('lib-types').innerHTML=Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`<a class="chip" href="library.html?type=${encodeURIComponent(k)}">${esc(k)} <b>${n}</b></a>`).join('');
    let seed=+new Date().toISOString().slice(0,10).replace(/-/g,'');const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;
    const pick=[];const pool=L.filter(e=>e.d);while(pick.length<6&&pool.length)pick.push(pool.splice(rnd()*pool.length|0,1)[0]);
    $('lib-pick').innerHTML=pick.map(e=>`<a class="lcard" href="${CD.href(e)}"><span class="no">${CD.year(e.y)} · ${esc(e.k)}</span><b>${esc(e.t)}</b><small>${esc([e.p,e.c].filter(Boolean).join(', '))}</small><span class="d">${esc(e.d)}</span></a>`).join('');
  }

  $('fgrid').innerHTML=FORENSICS.map(f=>{const cs=CASES.filter(c=>c.tags.includes(f.id));
    return `<div class="ftopic" id="f-${f.id}"><h3>${esc(f.name)}</h3><p>${esc(f.blurb)}</p><ul>${cs.map(c=>`<li><a href="case.html?id=${c.id}">${esc(c.title)}</a></li>`).join('')}</ul></div>`}).join('');
}

/* ---------- library entry: case.html?wd=Q… (imported, not reviewed; no discussion) ---------- */
const wd=new URLSearchParams(location.search).get('wd');
if($('article')&&wd){(async()=>{
  const el=$('article');el.innerHTML='<p class="src">Loading…</p>';
  const e=await CD.find(wd);
  if(!e){document.title='Case not found · Crime Diaries';el.innerHTML=`<p class="crumbs"><a href="library.html">← Library</a></p><h1>Case not found</h1><p>This entry is not in the library, or it was removed in the last update.</p>`;return}
  if(CD.isReviewed(e)){location.replace(CD.href(e));return}
  /* copied Wikipedia text earns no search ranking, and these pages should not surface in searches for people named in them */
  const robots=document.createElement('meta');robots.name='robots';robots.content='noindex';document.head.appendChild(robots);
  /* sensitive case: nothing is shown or fetched until the reader accepts the content warning (js/sensitive.js) */
  if(e.x){document.title='Sensitive case · Crime Diaries';el.innerHTML=`<p class="crumbs"><a href="library.html">← Library</a></p><p class="src">This is a sensitive case. Read the content warning to continue.</p>`;
    await CD.warn(e.x);
    if(e.x!=='attack'){document.title=`${e.t} · Crime Diaries`;CD.protectedPage(el,e);return}
  }
  document.title=`${e.t} · Library · Crime Diaries`;
  const wiki=CD.wiki(e),lang=e.l||'en',lname=CD.langName(lang),rtl=/^(ar|he|fa|ur|ps|yi|ckb|sd|ug|dv|arz|azb|mzn)$/.test(lang);
  const translate=`https://translate.google.com/translate?sl=${lang}&tl=en&u=${encodeURIComponent(wiki)}`;
  el.classList.add('wide');
  el.innerHTML=`<p class="crumbs"><a href="library.html">← Library</a> / ${esc(e.q)}</p>
    <h1>${esc(e.t)}</h1>${e.d?`<p class="aka">${esc(e.d)}</p>`:''}
    <div class="meta">${e.s?`<span class="st Unsolved">UNSOLVED</span>`:''}<span class="chip">${esc(e.k)}</span><span class="chip">${CD.year(e.y)}</span>${e.p||e.c?`<span class="chip">${esc([e.p,e.c].filter(Boolean).join(', '))}</span>`:''}</div>
    ${e.x?`<div class="notice sens"><b>Sensitive case.</b> Sections about the attacker, their motives or how the attack was carried out are kept closed: we do not give attackers the attention they wanted. You can open them, but please do not share them.</div>`:''}
    <div class="notice imported"><b>Imported, not reviewed.</b> This report is the Wikipedia article, shown here automatically. Crime Diaries has not checked it. It can change at any time, and may name people who were never convicted: a name in this text is not a finding of guilt. Passages that may describe how a victim died are collapsed; you choose whether to open them.</div>
    <div class="r-grid">
      <div class="r-main">
        <div class="gallery" id="gallery"></div>
        <div class="trbar" id="trbar"></div>
        <div class="report" id="report"><p class="lead">Loading the full report from Wikipedia…</p></div>
        <p class="src" id="wattr"></p>
      </div>
      <aside class="facts" aria-label="Case facts"><b>Case facts</b><dl id="facts">
        <dt>Type</dt><dd>${esc(e.k)}</dd>
        <dt>Year</dt><dd>${CD.year(e.y)}</dd>
        ${e.p||e.c?`<dt>Place</dt><dd>${esc([e.p,e.c].filter(Boolean).join(', '))}</dd>`:''}
        <dt>Status</dt><dd>${e.s?'Unsolved (as recorded on Wikidata)':'Not recorded here: see the report'}</dd>
        ${e.ll?`<dt>Map</dt><dd><a href="map.html#${esc(e.q)}">See it on the globe ›</a></dd>`:''}
        <dt>Record</dt><dd><a href="https://www.wikidata.org/wiki/${esc(e.q)}" target="_blank" rel="noopener">Wikidata ${esc(e.q)}</a></dd>
      </dl></aside>
    </div>
    <div class="notice"><b>Something wrong or harmful here?</b> <a href="https://github.com/preetsaini2004/crime-diaries/issues/new?title=${encodeURIComponent('Library entry '+e.q+': ')}" target="_blank" rel="noopener">Report it</a> and we will review or remove it. Discussion is open only on reviewed case files.</div>`;
  CD.report(el,e);
  CD.gallery($('gallery'),e.l||'en',e.w.replace(/_/g,' '));
})();return;
}

/* ---------- case page ---------- */
if($('article')){
  const id=new URLSearchParams(location.search).get('id'),i=CASES.findIndex(c=>c.id===id),c=CASES[i],el=$('article');
  if(!c){document.title='Case not found · Crime Diaries';el.innerHTML=`<p class="crumbs"><a href="index.html#cases">← All cases</a></p><h1>Case not found</h1><p>There is no file with that name in the records.</p>`;return}
  document.title=`${c.title} · Crime Diaries`;
  const prev=CASES[(i-1+CASES.length)%CASES.length],next=CASES[(i+1)%CASES.length];
  el.innerHTML=`<p class="crumbs"><a href="index.html#cases">← All cases</a> / CASE #${pad(c.no)}</p>
    <span class="stamp ${c.status}" aria-hidden="true">${c.status.toUpperCase()}</span>
    <h1>${esc(c.title)}</h1>${c.aka?`<p class="aka">${esc(c.aka)}</p>`:''}
    <div class="meta"><span class="st ${c.status}">${c.status.toUpperCase()}</span><span class="chip">${esc(c.place)}, ${esc(c.country)}</span><span class="chip">${c.year}</span><span class="chip">${esc(c.type)}</span></div>
    <h2>Summary</h2><p class="lead">${esc(c.summary)}</p>
    <h2 class="h-row">Timeline <button class="ghost" id="ev-start">▶ Follow the evidence</button></h2><ol class="timeline">${c.timeline.map(([d,t])=>`<li><time>${esc(d)}</time>${esc(t)}</li>`).join('')}</ol>
    <h2>Forensics</h2><p>${esc(c.forensics)}</p>
    <div class="meta">${c.tags.map(t=>{const f=FORENSICS.find(x=>x.id===t);return `<a class="chip" href="index.html#f-${t}">${esc(f?f.name:t)}</a>`}).join('')}</div>
    <h2>Outcome</h2><p>${esc(c.outcome)}</p>
    <div class="notice"><b>Facts only.</b> This page sticks to what sources record. Opinions and theories go in the Discussion below, in their own tab, so the two never mix.</div>
    <div class="gallery" id="gallery"></div>
    <h2>Sources</h2><ol class="sources">${c.sources.map(([t,u])=>`<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ol>
    <section id="discussion" class="discussion"></section>
    <div class="pager"><a href="case.html?id=${prev.id}">← ${esc(prev.title)}</a><a href="case.html?id=${next.id}">${esc(next.title)} →</a></div>`;

  /* images from the case's English Wikipedia source, if it has any safe ones */
  const wsrc=c.sources.map(([,u])=>/en\.wikipedia\.org\/wiki\/([^#?]+)/.exec(u)).find(Boolean);
  if(wsrc&&CD.gallery)CD.gallery($('gallery'),'en',decodeURIComponent(wsrc[1]).replace(/_/g,' '));else $('gallery').remove();

  /* Follow the evidence: step through the timeline one event at a time, then the forensics and the outcome */
  const steps=[...c.timeline.map(([d,t])=>({k:d,t})),{k:'The evidence',t:c.forensics},{k:'Outcome',t:c.outcome}];
  const ev=document.createElement('div');ev.className='evidence';ev.hidden=true;
  ev.setAttribute('role','dialog');ev.setAttribute('aria-modal','true');ev.setAttribute('aria-label',`Follow the evidence: ${c.title}`);
  ev.innerHTML=`<div class="ev-card"><div class="ev-top"><span class="no">CASE #${pad(c.no)} · ${esc(c.title)}</span><button class="ask-x" id="ev-x" aria-label="Close">×</button></div>
    <div class="ev-body" aria-live="polite"><p class="ev-k" id="ev-k"></p><p class="ev-t" id="ev-t"></p></div>
    <div class="ev-dots" id="ev-dots">${steps.map((_,n)=>`<button aria-label="Step ${n+1}"></button>`).join('')}</div>
    <div class="ev-nav"><button class="ghost" id="ev-prev">‹ Back</button><span id="ev-n"></span><button class="d-send" id="ev-next">Next ›</button></div></div>`;
  document.body.appendChild(ev);
  let at=0,opener=null;
  const show=n=>{at=Math.max(0,Math.min(steps.length-1,n));const s=steps[at];
    $('ev-k').textContent=s.k;$('ev-t').textContent=s.t;$('ev-n').textContent=`${at+1} / ${steps.length}`;
    $('ev-prev').disabled=at===0;$('ev-next').textContent=at===steps.length-1?'Finish':'Next ›';
    [...$('ev-dots').children].forEach((b,j)=>b.classList.toggle('on',j<=at));
    const body=ev.querySelector('.ev-body');body.classList.remove('in');void body.offsetWidth;body.classList.add('in')};
  const close=()=>{ev.hidden=true;document.body.classList.remove('gate-on');opener&&opener.focus()};
  $('ev-start').onclick=()=>{opener=$('ev-start');ev.hidden=false;document.body.classList.add('gate-on');show(0);$('ev-next').focus()};
  $('ev-prev').onclick=()=>show(at-1);
  $('ev-next').onclick=()=>at===steps.length-1?close():show(at+1);
  $('ev-x').onclick=close;
  $('ev-dots').onclick=e=>{const b=e.target.closest('button');if(b)show([...$('ev-dots').children].indexOf(b))};
  ev.addEventListener('keydown',e=>{if(e.key==='Escape')close();else if(e.key==='ArrowRight')show(at+1);else if(e.key==='ArrowLeft')show(at-1)});
}
})();
