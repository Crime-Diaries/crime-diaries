/* The map: every case with a town-level location, plus a timeline slider that replays history.
   Reviewed case files are larger yellow-ringed dots; imported library entries are small red dots. */
(()=>{
const $=id=>document.getElementById(id),esc=CD.esc;
if(!window.L){$('map-count').textContent='The map library could not load. Try again, or use the library list.';return}
const pts=[
  ...(window.CASES||[]).filter(c=>c.ll).map(c=>({id:c.id,t:c.title,y:c.year,k:c.type,where:`${c.place}, ${c.country}`,ll:c.ll,rev:1,href:`case.html?id=${c.id}`,s:c.status})),
  ...CD.items({sensitive:!!window.LIBRARY_SENSITIVE&&CD.sensOn()}).filter(e=>e.ll).map(e=>({id:e.q,t:e.t,y:e.y,k:e.k,where:[e.p,e.c].filter(Boolean).join(', '),ll:e.ll,href:CD.href(e),s:e.s,x:e.x}))
];
const types=[...new Set(pts.map(p=>p.k))].sort();
$('map-type').innerHTML='<option value="">All types</option>'+types.map(t=>`<option>${esc(t)}</option>`).join('');

const map=L.map('map',{preferCanvas:true,worldCopyJump:true,minZoom:2,zoomControl:true}).setView([30,0],2);
/* standard OpenStreetMap tiles (free, no key; follow https://operations.osmfoundation.org/policies/tiles/ ), darkened in css/site.css */
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:12,
  attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
const css=getComputedStyle(document.documentElement),RED=css.getPropertyValue('--red2').trim()||'#ff3b3b',TAPE=css.getPropertyValue('--tape').trim()||'#f2c400';
const layer=L.layerGroup().addTo(map);
pts.forEach(p=>{
  p.m=L.circleMarker(p.ll,p.rev?{radius:8,color:TAPE,weight:2,fillColor:RED,fillOpacity:.9}:{radius:4,color:'#060405',weight:1,fillColor:RED,fillOpacity:.75})
    .bindPopup(`<div class="map-pop"><span class="no">${p.x?CD.SENS_LABEL[p.x]+' · ':''}${CD.year(p.y)} · ${esc(p.k)}${p.rev?' · REVIEWED':''}${p.s?` · ${esc(p.s.toUpperCase())}`:''}</span><b>${esc(p.t)}</b><small>${esc(p.where)}</small><a href="${p.href}">Open the file ›</a></div>`);
});

const yrs=pts.map(p=>p.y),minY=Math.max(Math.min(...yrs),1500),maxY=Math.max(...yrs);
const slider=$('map-year');slider.min=minY;slider.max=maxY;slider.value=maxY;
function render(){
  const t=$('map-type').value,rev=$('map-rev').checked,upto=+slider.value;
  $('map-yl').textContent=+slider.value<=minY?`${minY} (and earlier)`:slider.value;
  let n=0;
  pts.forEach(p=>{const on=(!t||p.k===t)&&(!rev||p.rev)&&(p.y<=upto||(upto<=minY&&p.y<minY));
    if(on){n++;if(!layer.hasLayer(p.m))layer.addLayer(p.m)}else if(layer.hasLayer(p.m))layer.removeLayer(p.m)});
  $('map-count').textContent=`${n.toLocaleString('en')} of ${pts.length.toLocaleString('en')} cases with a known town shown. Click a dot to open its file.`;
}
$('map-type').onchange=$('map-rev').onchange=render;slider.oninput=render;

/* play history: sweep the slider from 1800 to today; off in calm mode */
let timer=null;
const stop=()=>{clearInterval(timer);timer=null;$('map-play').textContent='▶ Play history';$('map-play').setAttribute('aria-pressed','false')};
$('map-play').onclick=()=>{
  if(timer)return stop();
  if(CD.calm()){$('map-count').textContent='Calm mode is on, so history will not animate. Drag the slider instead.';return}
  if(+slider.value>=maxY)slider.value=Math.max(minY,1800);
  $('map-play').textContent='❚❚ Pause';$('map-play').setAttribute('aria-pressed','true');
  timer=setInterval(()=>{slider.value=+slider.value+2;render();if(+slider.value>=maxY)stop()},80);
};
document.addEventListener('cd:calm',e=>{if(e.detail)stop()});

/* map.html#Q123 opens on that case */
const focus=()=>{const id=decodeURIComponent(location.hash.slice(1));const p=pts.find(x=>x.id===id);if(p){map.setView(p.ll,8);p.m.openPopup()}};
render();focus();addEventListener('hashchange',focus);
})();
