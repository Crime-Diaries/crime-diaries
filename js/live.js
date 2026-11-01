/* "Live: crime in numbers" on the home page. Reads the newest month of street-level data from data.police.uk
   straight from the browser (no key, no server) and shows totals by category and by outcome. Never shows locations. */
(()=>{
const $=id=>document.getElementById(id);if(!$('live'))return;
const esc=CD.esc,API='https://data.police.uk/api/';
/* city centres; Greater Manchester Police stopped supplying data in 2019 and Scotland is not covered, so neither is listed */
const CITIES=[['Leeds',53.8008,-1.5491],['Birmingham',52.4862,-1.8904],['Bristol',51.4545,-2.5879],['Cardiff',51.4816,-3.1791],
  ['Belfast',54.5973,-5.9301],['Liverpool',53.4084,-2.9916],['Newcastle',54.9783,-1.6178],['London (Westminster)',51.5074,-0.1278]];
const sel=$('live-city');sel.innerHTML=CITIES.map((c,i)=>`<option value="${i}">${esc(c[0])}</option>`).join('');
let month=null,names=null;const cache={};
const getJSON=async u=>{const r=await fetch(u);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()};
const nf=new Intl.NumberFormat('en-GB');

function bars(el,title,note,rows){
  const max=Math.max(...rows.map(r=>r[1]),1),total=rows.reduce((a,r)=>a+r[1],0);
  el.innerHTML=`<figcaption><b>${esc(title)}</b><span>${esc(note)}</span></figcaption>
    <ol>${rows.map(([k,n])=>{const pct=Math.round(n/total*100);
      return `<li title="${esc(k)}: ${nf.format(n)} (${pct}%)"><span class="b-k">${esc(k)}</span><span class="b-bar"><i style="width:${(n/max*100).toFixed(1)}%"></i></span><span class="b-v">${nf.format(n)}</span></li>`}).join('')}</ol>`;
}
async function load(i){
  const [city,lat,lng]=CITIES[i];
  $('live-status').textContent=`Loading ${city}…`;
  try{
    if(!month){month=(await getJSON(API+'crime-last-updated')).date.slice(0,7)}
    if(!names){names={};(await getJSON(API+'crime-categories?date='+month)).forEach(c=>names[c.url]=c.name)}
    const list=cache[i]||(cache[i]=await getJSON(`${API}crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${month}`));
    const by=(f)=>{const m={};list.forEach(x=>{const k=f(x);m[k]=(m[k]||0)+1});return Object.entries(m).sort((a,b)=>b[1]-a[1])};
    const cats=by(x=>names[x.category]||x.category);
    let outs=by(x=>x.outcome_status?x.outcome_status.category:'No outcome recorded yet');
    if(outs.length>7){const rest=outs.slice(6).reduce((a,r)=>a+r[1],0);outs=[...outs.slice(0,6),['Other outcomes',rest]]}
    const label=new Date(month+'-01T00:00:00Z').toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'});
    bars($('live-cat'),'What was reported',`${nf.format(list.length)} crimes · ${label}`,cats);
    bars($('live-out'),'What happened next','Latest outcome police recorded for each crime',outs);
    $('live-status').textContent=`${city}, ${label}: the newest month police have published.`;
  }catch(e){
    $('live-status').textContent=`Live data could not be loaded right now (${e.message}). Try again later.`;
    $('live-cat').innerHTML=$('live-out').innerHTML='';
  }
}
sel.onchange=()=>load(+sel.value);
/* fetch only when the section comes into view: the data is a few hundred KB */
const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();load(+sel.value)}},{rootMargin:'200px'});
io.observe($('live'));
})();
