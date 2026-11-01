/* The library page: search and filter the imported index (data/library.js). Reviewed case files are listed first. */
(async()=>{
const $=id=>document.getElementById(id),esc=CD.esc;
/* sensitive cases (terror, massacres, riots, sexual violence ...) only when the visitor turns them on */
const sens=$('lib-sens');sens.checked=CD.sensOn();
sens.onchange=()=>{CD.setSens(sens.checked);location.reload()};
if(sens.checked){$('lib-count').textContent='Loading sensitive cases…';try{await CD.loadSensitive()}catch{sens.checked=false}}
const L=CD.items({sensitive:sens.checked}),R=(window.CASES||[]);
const PAGE=48;let shown=PAGE;
const century=y=>y<=0?'Before 1 CE':y<1500?'Before 1500':Math.floor((y-1)/100)*100+1+'–'+(Math.floor((y-1)/100)+1)*100;
const ERAS=['Before 1 CE','Before 1500',...[...new Set(L.filter(e=>e.y>=1500).map(e=>century(e.y)))].sort()];

$('lib-intro').innerHTML=`<b>${L.length.toLocaleString('en')}</b> cases indexed from Wikidata, plus <b>${R.length}</b> reviewed case files. Last updated ${esc(window.LIBRARY_UPDATED||'unknown')}.`;
const opts=(el,all,vals)=>{el.innerHTML=`<option value="">${all}</option>`+vals.map(v=>`<option>${esc(v)}</option>`).join('')};
const count=(f)=>{const m={};L.forEach(e=>{const k=f(e);if(k)m[k]=(m[k]||0)+1});return m};
const types=count(e=>e.k);opts($('lib-type'),'All types',Object.keys(types).sort());
opts($('lib-era'),'All periods',ERAS.filter(x=>L.some(e=>century(e.y)===x)));
const cs=count(e=>e.c);opts($('lib-country'),'All countries',Object.keys(cs).sort());

/* filters can come in the URL, e.g. library.html?type=Kidnapping (links from the home page) */
const P=new URLSearchParams(location.search);
if(P.get('type'))$('lib-type').value=P.get('type');
if(P.get('q'))$('lib-q').value=P.get('q');

const hay=new Map(L.map(e=>[e.q,[e.t,e.d,e.p,e.c,e.k].join(' ').toLowerCase()]));
function list(){
  const q=$('lib-q').value.trim().toLowerCase(),t=$('lib-type').value,era=$('lib-era').value,c=$('lib-country').value,u=$('lib-uns').checked;
  const words=q.split(/\s+/).filter(Boolean);
  let out=L.filter(e=>(!t||e.k===t)&&(!era||century(e.y)===era)&&(!c||e.c===c)&&(!u||e.s==='Unsolved')&&words.every(w=>hay.get(e.q).includes(w)));
  const s=$('lib-sort').value;
  out.sort(s==='new'?(a,b)=>b.y-a.y:s==='az'?(a,b)=>a.t.localeCompare(b.t):(a,b)=>a.y-b.y);
  /* reviewed files that fit the search come first */
  const rv=R.filter(r=>(!u||r.status==='Unsolved')&&(!c||r.country===c)&&words.every(w=>[r.title,r.aka,r.place,r.country,r.type,r.summary].join(' ').toLowerCase().includes(w))&&!t&&!era);
  return {out,rv};
}
function render(reset){
  if(reset)shown=PAGE;
  const {out,rv}=list();
  $('lib-count').textContent=`${(out.length+rv.length).toLocaleString('en')} result${out.length+rv.length===1?'':'s'}${rv.length?` (${rv.length} reviewed)`:''}`;
  const card=e=>`<a class="lcard${e.x?' sens':''}" href="${CD.href(e)}"><span class="no">${e.x?`<span class="tag sens-tag">${CD.SENS_LABEL[e.x]}</span> `:''}${CD.year(e.y)} · ${esc(e.k)}${e.s?' · <i class="Unsolved">UNSOLVED</i>':''}${e.l?` · <span title="Article in ${esc(CD.langName(e.l))}">${esc(e.l.toUpperCase())}</span>`:''}</span><b>${esc(e.t)}</b><small>${esc([e.p,e.c].filter(Boolean).join(', '))}</small>${e.d?`<span class="d">${esc(e.d)}</span>`:''}</a>`;
  const rcard=r=>`<a class="lcard reviewed" href="case.html?id=${r.id}"><span class="no">${r.year} · ${esc(r.type)} · <i class="${r.status}">${r.status.toUpperCase()}</i></span><b>${esc(r.title)}</b><small>${esc(r.place)}, ${esc(r.country)}</small><span class="d"><span class="tag">REVIEWED</span> ${esc(r.summary.split(/(?<=\.)\s/)[0])}</span></a>`;
  $('lib-list').innerHTML=(rv.map(rcard).join('')+out.slice(0,shown).map(card).join(''))||`<div class="empty">Nothing in the library matches that. Try fewer filters.</div>`;
  $('lib-more').hidden=out.length<=shown;
  $('lib-more').textContent=`Show more (${(out.length-shown).toLocaleString('en')} left)`;
}
let t;$('lib-q').addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>render(true),120)});
['lib-type','lib-era','lib-country','lib-sort','lib-uns'].forEach(id=>$(id).onchange=()=>render(true));
$('lib-more').onclick=()=>{shown+=PAGE;render()};
render(true);
})();
