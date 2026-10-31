/* Page logic for the home page (#grid) and the case page (#article). Data comes from data/cases.js. */
(()=>{
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decade=c=>Math.floor(c.year/10)*10+'s';
const pad=n=>String(n).padStart(3,'0');
const store={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
const eyes=()=>Eye.all;
const say=html=>{const el=$('eye-line');if(el)el.innerHTML=html};

/* ---------- the eye in the nav bar, on every page ---------- */
if($('mini-eye'))Eye.create($('mini-eye'),{mode:'pixel',fill:.95});

/* ---------- intro: first visit, ?intro, or the Replay button ---------- */
function runIntro(withSound){
  const box=$('intro');if(!box||!window.playIntro)return;
  box.hidden=false;box.classList.remove('out');document.body.classList.add('intro-on');scrollTo(0,0);
  let skip;const done=()=>{store.set('cd_intro_seen','1');box.classList.add('out');document.body.classList.remove('intro-on');
    setTimeout(()=>{box.hidden=true},900);$('skip').onclick=null;eyes().forEach(e=>e.blink())};
  skip=playIntro(done,{sound:withSound});$('skip').onclick=()=>skip();
  let snd=!!withSound;const lab=()=>{$('snd').textContent=snd?'SOUND ON':'SOUND OFF';$('snd').setAttribute('aria-pressed',snd)};lab();
  $('snd').onclick=()=>{snd=!snd;skip.sound(snd);lab()};
}
const replay=$('replay');
if(replay)replay.onclick=()=>{if($('intro'))runIntro(true);else location.href='index.html?intro'};

/* ---------- home page ---------- */
if($('grid')){
  const hero=Eye.create($('hero-eye'),{fill:innerWidth<640?.95:.6,cy:.36});
  if(matchMedia('(pointer: coarse)').matches)say('The Eye is watching. Tap anywhere.');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(location.search.includes('intro')||(!store.get('cd_intro_seen')&&!reduce))runIntro();

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

  $('fgrid').innerHTML=FORENSICS.map(f=>{const cs=CASES.filter(c=>c.tags.includes(f.id));
    return `<div class="ftopic" id="f-${f.id}"><h3>${esc(f.name)}</h3><p>${esc(f.blurb)}</p><ul>${cs.map(c=>`<li><a href="case.html?id=${c.id}">${esc(c.title)}</a></li>`).join('')}</ul></div>`}).join('');
}

/* ---------- case page ---------- */
if($('article')){
  const id=new URLSearchParams(location.search).get('id'),i=CASES.findIndex(c=>c.id===id),c=CASES[i],el=$('article');
  if(!c){document.title='Case not found · Crime Diaries';el.innerHTML=`<p class="crumbs"><a href="index.html#cases">← All cases</a></p><h1>Case not found</h1><p>There is no file with that name in the records.</p>`;return}
  document.title=`${c.title} · Crime Diaries`;
  const prev=CASES[(i-1+CASES.length)%CASES.length],next=CASES[(i+1)%CASES.length];
  el.innerHTML=`<p class="crumbs"><a href="index.html#cases">← All cases</a> / CASE #${pad(c.no)}</p>
    <h1>${esc(c.title)}</h1>${c.aka?`<p class="aka">${esc(c.aka)}</p>`:''}
    <div class="meta"><span class="st ${c.status}">${c.status.toUpperCase()}</span><span class="chip">${esc(c.place)}, ${esc(c.country)}</span><span class="chip">${c.year}</span><span class="chip">${esc(c.type)}</span></div>
    <h2>Summary</h2><p class="lead">${esc(c.summary)}</p>
    <h2>Timeline</h2><ol class="timeline">${c.timeline.map(([d,t])=>`<li><time>${esc(d)}</time>${esc(t)}</li>`).join('')}</ol>
    <h2>Forensics</h2><p>${esc(c.forensics)}</p>
    <div class="meta">${c.tags.map(t=>{const f=FORENSICS.find(x=>x.id===t);return `<a class="chip" href="index.html#f-${t}">${esc(f?f.name:t)}</a>`}).join('')}</div>
    <h2>Outcome</h2><p>${esc(c.outcome)}</p>
    <div class="notice"><b>Facts only.</b> This page sticks to what sources record. Opinions and theories go in the Discussion below, in their own tab, so the two never mix.</div>
    <h2>Sources</h2><ol class="sources">${c.sources.map(([t,u])=>`<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ol>
    <section id="discussion" class="discussion"></section>
    <div class="pager"><a href="case.html?id=${prev.id}">← ${esc(prev.title)}</a><a href="case.html?id=${next.id}">${esc(next.title)} →</a></div>`;
}
})();
