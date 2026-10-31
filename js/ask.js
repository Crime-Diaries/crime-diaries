/* Ask the Eye: a chat panel that searches the case files.
   Offline mode: answers come from keyword matching over CASES, never from guessing.
   answer(question) is the one function to replace with a call to an AI backend later. */
(()=>{
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STOP=new Set('a an the of in on at to for and or is are was were be by with about from any all me show find list tell what which who whom where when how cases case files file crime crimes there their that this those these did does do give some i you can please'.split(' '));
const COUNTRY={uk:'United Kingdom',britain:'United Kingdom',england:'United Kingdom',british:'United Kingdom',english:'United Kingdom',usa:'United States',us:'United States',america:'United States',american:'United States',australia:'Australia',australian:'Australia',belgium:'Belgium',belgian:'Belgium',germany:'Germany',german:'Germany'};
const METHOD={dna:'dna',genealogy:'genealogy',genetic:'genealogy',fingerprint:'fingerprints',fingerprints:'fingerprints',cipher:'cryptanalysis',ciphers:'cryptanalysis',code:'cryptanalysis',codes:'cryptanalysis',cryptanalysis:'cryptanalysis',poison:'toxicology',poisons:'toxicology',toxicology:'toxicology',profiling:'profiling',profile:'profiling',handwriting:'documents',letters:'documents',documents:'documents',trace:'trace',wood:'trace',footprints:'trace'};
const fname=id=>(FORENSICS.find(f=>f.id===id)||{}).name||id;

function answer(q){
  const words=q.toLowerCase().replace(/[^a-z0-9\s'-]/g,' ').split(/\s+/).filter(Boolean);
  if(!words.length||/^(hi|hello|hey|help)$/.test(words.join(' ')))return {text:`Ask me about a case, a place, a decade or a forensic method. I search the ${CASES.length} files in the archive and show you what's in the records.`};
  /* filters pulled out of the question */
  let status=null,decade=null,year=null;const countries=new Set(),methods=new Set(),rest=[];
  for(const w of words){
    if(w==='unsolved'||w==='cold'||w==='open'||w==='mystery'||w==='mysteries')status='Unsolved';
    else if(w==='solved'||w==='closed'||w==='convicted')status='Solved';
    else if(/^1[89]\d0s$|^20[0-2]0s$/.test(w))decade=w;
    else if(/^1[89]\d\d$|^20[0-2]\d$/.test(w))year=+w;
    else if(COUNTRY[w])countries.add(COUNTRY[w]);
    else if(METHOD[w])methods.add(METHOD[w]);
    else if(!STOP.has(w)&&w.length>1)rest.push(w.replace(/s$/,''));
  }
  const hay=c=>({title:(c.title+' '+c.aka).toLowerCase(),place:(c.place+' '+c.country+' '+c.type).toLowerCase(),
    body:[c.summary,c.forensics,c.outcome,...c.timeline.map(t=>t[1]),...c.tags.map(fname)].join(' ').toLowerCase()});
  const scored=CASES.filter(c=>(!status||c.status===status)&&(!decade||Math.floor(c.year/10)*10+'s'===decade)&&(!year||c.year===year)
      &&(!countries.size||countries.has(c.country))&&[...methods].every(m=>c.tags.includes(m)))
    .map(c=>{const h=hay(c);let s=0;for(const w of rest){if(h.title.includes(w))s+=3;else if(h.place.includes(w))s+=2;else if(h.body.includes(w))s+=1}return {c,s}})
    .filter(x=>!rest.length||x.s>0).sort((a,b)=>b.s-a.s||a.c.year-b.c.year);
  /* drop weak matches when one file clearly stands out (e.g. "man" in "who was the Somerton man") */
  if(rest.length&&scored.length)for(let top=scored[0].s,i=scored.length-1;i>0;i--)if(scored[i].s<top/2)scored.splice(i,1);
  if(!scored.length)return {text:`Nothing in our records matches “${esc(q)}”. I only know the ${CASES.length} files in this archive, so try a name, a place, a decade or a method like DNA.`};
  const shown=scored.slice(0,4).map(x=>x.c);
  const first=s=>s.split(/(?<=\.)\s/)[0];
  return {text:`I found <b>${scored.length}</b> file${scored.length>1?'s':''}${scored.length>4?', here are the closest 4':''}:`,
    cases:shown.map(c=>`<a class="ask-hit" href="case.html?id=${c.id}"><b>${esc(c.title)}</b><span>${c.year} · ${esc(c.country)} · <i class="${c.status}">${c.status}</i></span><small>${esc(first(c.summary))}</small></a>`)};
}

/* ---------- panel ---------- */
const wrap=document.createElement('div');wrap.className='ask';
wrap.innerHTML=`<button class="ask-open" id="ask-open" aria-expanded="false" aria-controls="ask-panel"><canvas id="ask-eye" aria-hidden="true"></canvas>Ask the Eye</button>
  <div class="ask-panel" id="ask-panel" role="dialog" aria-label="Ask the Eye" hidden>
    <div class="ask-head"><div><b>THE EYE</b><small>Offline search mode · answers only from the case files</small></div><button class="ask-x" id="ask-x" aria-label="Close">×</button></div>
    <div class="ask-log" id="ask-log" aria-live="polite"></div>
    <div class="ask-sug" id="ask-sug">${['Unsolved cases','Solved with DNA','Crimes in the UK','Cases from the 1940s','Ciphers'].map(s=>`<button>${s}</button>`).join('')}</div>
    <form class="ask-form" id="ask-form"><input id="ask-q" placeholder="Ask about a case, place or method…" autocomplete="off" aria-label="Your question"><button>ASK</button></form>
  </div>`;
document.body.appendChild(wrap);
const $=id=>document.getElementById(id),log=$('ask-log');
const eye=Eye.create($('ask-eye'),{mode:'pixel',fill:.95});
const add=(who,html)=>{const d=document.createElement('div');d.className='msg '+who;d.innerHTML=html;log.appendChild(d);log.scrollTop=log.scrollHeight};
let greeted=false;
function toggle(open){
  $('ask-panel').hidden=!open;$('ask-open').setAttribute('aria-expanded',open);wrap.classList.toggle('on',open);
  if(open){if(!greeted){greeted=true;add('eye',answer('help').text)}$('ask-q').focus()}
}
$('ask-open').onclick=()=>toggle($('ask-panel').hidden);
$('ask-x').onclick=()=>toggle(false);
addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('ask-panel').hidden)toggle(false)});
function ask(q){
  if(!q.trim())return;add('me',esc(q));
  Eye.all.forEach(e=>e.squint(true));
  setTimeout(()=>{const a=answer(q);Eye.all.forEach(e=>{e.squint(false);e.interest(!!a.cases)});setTimeout(()=>Eye.all.forEach(e=>e.interest(false)),1500);
    add('eye',a.text+(a.cases?`<div class="ask-hits">${a.cases.join('')}</div>`:''))},450);
}
$('ask-form').onsubmit=e=>{e.preventDefault();ask($('ask-q').value);$('ask-q').value=''};
$('ask-sug').onclick=e=>{const b=e.target.closest('button');if(b)ask(b.textContent)};
window.AskEye={open:()=>toggle(true),answer};
})();
