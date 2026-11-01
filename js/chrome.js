/* Shared on every page: the first-visit notice, Calm mode, the eye in the nav bar and the Replay intro button.
   Load after js/eye.js and before the page's own scripts. Exposes window.CD. */
(()=>{
const $=id=>document.getElementById(id);
const store={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
const root=document.documentElement;
const NOTICE='cd_notice_v1';

/* ---------- Calm mode: no intro autoplay, no CRT flicker, eyes drawn still. On by default with reduced motion. ---------- */
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const saved=store.get('cd_calm');
function setCalm(on,persist){
  root.classList.toggle('calm',on);
  const b=$('calm');if(b){b.setAttribute('aria-pressed',on);b.textContent=on?'Calm: on':'Calm'}
  if(persist)store.set('cd_calm',on?'1':'0');
  document.dispatchEvent(new CustomEvent('cd:calm',{detail:on}));
}
setCalm(saved?saved==='1':reduce,false);
if($('calm'))$('calm').onclick=()=>setCalm(!root.classList.contains('calm'),true);

/* ---------- the eye in the nav bar ---------- */
if($('mini-eye')&&window.Eye)Eye.create($('mini-eye'),{mode:'pixel',fill:.95});

/* ---------- Replay intro: the intro lives on the home page ---------- */
const replay=$('replay');
if(replay)replay.onclick=()=>{if($('intro')&&window.CD.runIntro)window.CD.runIntro(true);else location.href='index.html?intro'};

/* ---------- first-visit notice ---------- */
/* gate(cb, {intro}) calls cb(choice) once the visitor has accepted the notice.
   choice is 'intro' or 'enter' when they accept now, or null when they had already accepted before. */
function gate(cb,opt={}){
  if(store.get(NOTICE)){cb(null);return}
  const box=document.createElement('div');
  box.className='notice-gate';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-labelledby','ng-title');
  box.innerHTML=`<div class="ng-card">
    <p class="ng-kicker">Before you enter</p>
    <h2 id="ng-title">For education only</h2>
    <p>Crime Diaries documents real cases to show how crimes are investigated and how evidence works.</p>
    <ul>
      <li>We do <b>not</b> promote, glorify or condone violence or any crime.</li>
      <li>Our case files never describe how to commit a crime or show how a victim died. The imported library links to Wikipedia, which may.</li>
      <li>Behind every case are real victims and families. Read and discuss with respect.</li>
      <li>Never name a living person as guilty unless a court has convicted them.</li>
      <li>Sensitive cases (terror attacks, massacres, sexual violence) are hidden unless you turn them on, and each opens behind its own content warning.</li>
    </ul>
    <p class="ng-help">If you are in danger, or thinking of harming yourself or someone else, contact your local emergency number now.</p>
    ${opt.intro?'<p class="ng-warn">The intro is a short film with dramatised scenes of violence and a gunshot sound. You can skip it now or at any time.</p>':''}
    <div class="ng-row">
      ${opt.intro?'<button class="ng-go" data-c="intro">I understand · play the intro</button><button class="ng-alt" data-c="enter">Enter without the intro</button>':'<button class="ng-go" data-c="enter">I understand · enter</button>'}
    </div>
    <p class="ng-more"><a href="about.html">Read our principles</a></p>
  </div>`;
  document.body.appendChild(box);document.body.classList.add('gate-on');
  const btns=[...box.querySelectorAll('button')];btns[0].focus();
  box.addEventListener('keydown',e=>{ /* keep focus inside the notice */
    if(e.key!=='Tab')return;const f=[...box.querySelectorAll('button,a')],i=f.indexOf(document.activeElement);
    if(e.shiftKey&&i<=0){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&i===f.length-1){e.preventDefault();f[0].focus()}
  });
  box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
    store.set(NOTICE,new Date().toISOString());box.remove();document.body.classList.remove('gate-on');cb(b.dataset.c)};
}
/* pages without their own intro logic just show the notice */
const own=$('intro');
if(!own&&!/about\.html$/.test(location.pathname))gate(()=>{});

const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* Wikidata years are astronomical: 0 is 1 BCE, -43 is 44 BCE */
const year=y=>y>0?String(y):`${1-y} BCE`;
/* a library entry that is also a reviewed case file links to the reviewed file instead */
const reviewed={};
(window.CASES||[]).forEach(c=>c.sources.forEach(([,u])=>{const m=/en\.wikipedia\.org\/wiki\/([^#?]+)/.exec(u);if(m)reviewed[decodeURIComponent(m[1])]=c.id}));
const isReviewed=e=>!e.l&&reviewed[e.w]; /* reviewed files cite English Wikipedia pages only */
const href=e=>isReviewed(e)?`case.html?id=${reviewed[e.w]}`:`case.html?wd=${e.q}`;
/* items({sensitive:true}) adds the sensitive cases, once loadSensitive() has loaded them */
const items=(o={})=>[...(window.LIBRARY&&LIBRARY.items||[]),...(o.sensitive&&window.LIBRARY_SENSITIVE?LIBRARY_SENSITIVE.items:[])].filter(e=>!isReviewed(e));
/* sensitive cases (data/sensitive.js, ~1.4 MB) load only when needed: the visitor turned them on, or opened one */
let sensP=null;
const loadSensitive=()=>window.LIBRARY_SENSITIVE?Promise.resolve():sensP||(sensP=new Promise((ok,no)=>{
  const s=document.createElement('script');s.src='data/sensitive.js';s.onload=ok;s.onerror=()=>{sensP=null;no(new Error('could not load'))};document.head.appendChild(s)}));
const sensOn=()=>store.get('cd_sens')==='1';
const setSens=on=>store.set('cd_sens',on?'1':'0');
const SENS_LABEL={attack:'SENSITIVE',sexual:'PROTECTED',child:'PROTECTED'};
/* the case for a Wikidata id, from either file (loads the sensitive one if it is not in the main file) */
const find=async q=>{const f=x=>(x&&x.items||[]).find(e=>e.q===q);let e=f(window.LIBRARY);if(e)return e;try{await loadSensitive()}catch{}return f(window.LIBRARY_SENSITIVE)};
/* Wikipedia edition helpers: 'ja' gives ja.wikipedia.org and "Japanese" */
let names;try{names=new Intl.DisplayNames(['en'],{type:'language'})}catch{}
const langName=l=>{try{return names&&names.of(l)||l}catch{return l}};
const wiki=e=>`https://${e.l||'en'}.wikipedia.org/wiki/${encodeURIComponent(e.w)}`;

window.CD={store,gate,calm:()=>root.classList.contains('calm'),setCalm,esc,year,href,reviewed,isReviewed,items,langName,wiki,loadSensitive,sensOn,setSens,find,SENS_LABEL};
})();
