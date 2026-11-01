/* The globe: a 3D Earth (CesiumJS) with every case that has a known town, a history slider, imagery and "look"
   choices, and an optional homicide-rate layer from the World Bank, fetched live.
   No Cesium ion account or key is used: imagery comes from NASA GIBS and OpenStreetMap.
   Without WebGL the flat Leaflet map (js/map.js) loads instead. */
(async()=>{
const $=id=>document.getElementById(id),esc=CD.esc;
/* sensitive cases only when the visitor turns them on (shared setting with the library) */
const sens=$('map-sens');sens.checked=CD.sensOn();sens.onchange=()=>{CD.setSens(sens.checked);location.reload()};
if(sens.checked){try{await CD.loadSensitive()}catch{sens.checked=false}}
const hasWebGL=()=>{try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'))}catch{return false}};

/* ---------- fallback: the flat map ---------- */
function flat(why){
  $('globe-opts').hidden=true;$('map-find').hidden=true;document.querySelector('.map-page .page-h').textContent='THE MAP';document.querySelector('.globe-wrap').classList.add('flat');
  ['hud-n','hud-utc','hud-pos'].forEach(id=>$(id).parentNode.hidden=true);
  const css=document.createElement('link');css.rel='stylesheet';css.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';document.head.appendChild(css);
  const add=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.body.appendChild(s)});
  add('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js').then(()=>add('js/map.js'))
    .then(()=>{$('map-src').insertAdjacentHTML('afterbegin',`<b>${esc(why)}</b> Showing the flat map instead. `)})
    .catch(()=>{$('map-count').textContent='The map could not load. Use the library list instead.'});
}
if(!window.Cesium||!hasWebGL())return flat(window.Cesium?'This device has no 3D graphics (WebGL).':'The 3D globe could not load.');

/* ---------- the cases ---------- */
const pts=[
  ...(window.CASES||[]).filter(c=>c.ll).map(c=>({id:c.id,t:c.title,y:c.year,k:c.type,where:`${c.place}, ${c.country}`,ll:c.ll,rev:1,href:`case.html?id=${c.id}`,s:c.status})),
  ...CD.items({sensitive:sens.checked}).filter(e=>e.ll).map(e=>({id:e.q,t:e.t,y:e.y,k:e.k,where:[e.p,e.c].filter(Boolean).join(', '),ll:e.ll,href:CD.href(e),s:e.s,x:e.x}))
];
const types=[...new Set(pts.map(p=>p.k))].sort();
$('map-type').innerHTML='<option value="">All types</option>'+types.map(t=>`<option>${esc(t)}</option>`).join('');
$('map-cases').innerHTML=pts.map(p=>`<option value="${esc(p.t)} (${CD.year(p.y)})"></option>`).join('');

/* ---------- the viewer: no ion, no terrain, renders only when something changes ---------- */
const C=Cesium;
const GIBS=(layer,date,ext)=>new C.UrlTemplateImageryProvider({
  url:`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${date}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.${ext}`,
  maximumLevel:8,credit:new C.Credit('Imagery: NASA Earth Observatory / NASA GIBS')});
const VIEWS={
  night:()=>GIBS('VIIRS_Black_Marble','2016-01-01','png'),
  day:()=>GIBS('BlueMarble_ShadedRelief_Bathymetry','2004-08-01','jpeg'),
  streets:()=>new C.OpenStreetMapImageryProvider({url:'https://tile.openstreetmap.org/',maximumLevel:12,credit:new C.Credit('© OpenStreetMap contributors')})
};
let viewer;
try{
  viewer=new C.Viewer('map',{baseLayer:new C.ImageryLayer(VIEWS.night()),baseLayerPicker:false,geocoder:false,homeButton:false,
    sceneModePicker:false,navigationHelpButton:false,animation:false,timeline:false,fullscreenButton:false,infoBox:false,
    selectionIndicator:false,requestRenderMode:true,maximumRenderTimeChange:Infinity});
}catch(err){return flat('The 3D globe could not start on this device.')}
const scene=viewer.scene,cam=viewer.camera,redraw=()=>scene.requestRender();
if(/[?&]debug/.test(location.search))window.__globe=viewer; /* for testing: map.html?debug */
/* render-on-demand misses work finished in the background (surface shapes), so keep redrawing for a few seconds */
const pulse=(ms=1500)=>{const t0=performance.now();const go=()=>{redraw();const t=performance.now()-t0;
  if(t<ms||(!viewer.dataSourceDisplay.ready&&t<30000))setTimeout(go,150)};go()};
scene.globe.depthTestAgainstTerrain=true; /* hide dots on the far side of the Earth */
scene.globe.baseColor=C.Color.fromCssColorString('#060405');
scene.backgroundColor=C.Color.fromCssColorString('#060405');
cam.setView({destination:C.Cartesian3.fromDegrees(10,25,21000000)});

const css=getComputedStyle(document.documentElement),RED=C.Color.fromCssColorString(css.getPropertyValue('--red2').trim()||'#ff3b3b'),
  TAPE=C.Color.fromCssColorString(css.getPropertyValue('--tape').trim()||'#f2c400'),INK=C.Color.fromCssColorString('#060405');
const dots=scene.primitives.add(new C.PointPrimitiveCollection());
pts.forEach(p=>{p.prim=dots.add({position:C.Cartesian3.fromDegrees(p.ll[1],p.ll[0],8000),pixelSize:p.rev?12:6,color:RED,
  outlineColor:p.rev?TAPE:INK,outlineWidth:p.rev?2:1,id:p})});

/* ---------- filters and the history slider ---------- */
const yrs=pts.map(p=>p.y),minY=Math.max(Math.min(...yrs),1500),maxY=Math.max(...yrs);
const slider=$('map-year');slider.min=minY;slider.max=maxY;slider.value=maxY;
function render(){
  const t=$('map-type').value,rev=$('map-rev').checked,upto=+slider.value;
  $('map-yl').textContent=upto<=minY?`${minY} (and earlier)`:upto;
  let n=0;pts.forEach(p=>{p.prim.show=(!t||p.k===t)&&(!rev||p.rev)&&(p.y<=upto||(upto<=minY&&p.y<minY));if(p.prim.show)n++});
  $('map-count').textContent=`${n.toLocaleString('en')} of ${pts.length.toLocaleString('en')} cases with a known town. Drag to turn the Earth; click a dot to open its file.`;
  $('hud-n').textContent=`${n.toLocaleString('en')} FILES ON SCREEN · UP TO ${upto}`;
  redraw();
}
$('map-type').onchange=$('map-rev').onchange=render;slider.oninput=render;

let timer=null;
const stopPlay=()=>{clearInterval(timer);timer=null;$('map-play').textContent='▶ Play history';$('map-play').setAttribute('aria-pressed','false')};
$('map-play').onclick=()=>{
  if(timer)return stopPlay();
  if(CD.calm()){$('map-count').textContent='Calm mode is on, so history will not animate. Drag the slider instead.';return}
  if(+slider.value>=maxY)slider.value=Math.max(minY,1800);
  $('map-play').textContent='❚❚ Pause';$('map-play').setAttribute('aria-pressed','true');
  timer=setInterval(()=>{slider.value=+slider.value+2;render();if(+slider.value>=maxY)stopPlay()},80);
};

/* ---------- the case card, hover label and fly-to ---------- */
const card=$('g-card'),tip=$('g-tip');
function open(p,fly){
  card.hidden=false;
  card.innerHTML=`<button class="ask-x" id="g-x" aria-label="Close">×</button><span class="no">${p.x?`<span class="tag sens-tag">${CD.SENS_LABEL[p.x]}</span> `:''}${CD.year(p.y)} · ${esc(p.k)}${p.rev?' · REVIEWED':''}${p.s?' · '+esc(p.s.toUpperCase()):''}</span>
    <b>${esc(p.t)}</b><small>${esc(p.where)}</small><a class="d-send" href="${p.href}">Open the file ›</a>`;
  $('g-x').onclick=()=>{card.hidden=true};
  if(fly){stopSpin();cam.flyTo({destination:C.Cartesian3.fromDegrees(p.ll[1],p.ll[0],900000),duration:CD.calm()?0:2.4})}
}
const handler=new C.ScreenSpaceEventHandler(scene.canvas);
const pickAt=pos=>{const o=scene.pick(pos);return o&&o.id};
handler.setInputAction(e=>{
  const id=pickAt(e.position);
  if(id&&id.href)open(id,true);
  else if(id&&id.properties&&id.properties.iso3)showRate(id,e.position,true);
},C.ScreenSpaceEventType.LEFT_CLICK);
handler.setInputAction(e=>{
  const id=pickAt(e.endPosition);scene.canvas.style.cursor=id?'pointer':'';
  if(id&&id.href){tip.hidden=false;tip.textContent=`${id.t} · ${CD.year(id.y)}`;place(e.endPosition)}
  else if(id&&id.properties&&id.properties.iso3)showRate(id,e.endPosition);
  else tip.hidden=true;
},C.ScreenSpaceEventType.MOUSE_MOVE);
const place=pos=>{tip.style.left=Math.min(pos.x+14,scene.canvas.clientWidth-220)+'px';tip.style.top=(pos.y+14)+'px'};
$('map-find').addEventListener('change',()=>{const v=$('map-find').value,p=pts.find(x=>`${x.t} (${CD.year(x.y)})`===v);
  if(p){if(!p.prim.show){$('map-type').value='';$('map-rev').checked=false;slider.value=maxY;render()}open(p,true)}});
/* map.html#Q123 (from a case page) flies to that case */
const focus=()=>{const id=decodeURIComponent(location.hash.slice(1)),p=pts.find(x=>x.id===id);if(p)open(p,true)};

/* ---------- imagery and look ---------- */
$('g-view').onchange=()=>{const layers=viewer.imageryLayers;layers.removeAll();layers.addImageryProvider(VIEWS[$('g-view').value]());redraw()};
const LOOKS={nvg:()=>C.PostProcessStageLibrary.createNightVisionStage(),noir:()=>C.PostProcessStageLibrary.createBlackAndWhiteStage()};
let stage=null;
function setLook(){
  if(stage){scene.postProcessStages.remove(stage);stage=null}
  const v=CD.calm()?'':$('g-look').value; /* the night-vision look flickers, so calm mode keeps it off */
  if(v){stage=scene.postProcessStages.add(LOOKS[v]())}
  $('g-look').disabled=CD.calm();redraw();
}
$('g-look').onchange=setLook;

/* ---------- slow spin until the visitor touches the globe (never in calm mode or a hidden tab) ---------- */
let spinning=!CD.calm()&&!location.hash,last=performance.now();
function stopSpin(){spinning=false}
['pointerdown','wheel','touchstart','keydown'].forEach(ev=>scene.canvas.addEventListener(ev,stopSpin,{passive:true}));
(function spin(now){
  if(spinning&&!document.hidden&&!CD.calm()){cam.rotate(C.Cartesian3.UNIT_Z,-(now-last)*0.00004);redraw()}
  last=now;if(spinning)requestAnimationFrame(spin);
})(last);
document.addEventListener('cd:calm',e=>{if(e.detail){stopSpin();stopPlay()}setLook()});

/* ---------- HUD: camera position and UTC time ---------- */
const deg=(v,p,n)=>`${Math.abs(v).toFixed(2)}°${v>=0?p:n}`;
cam.changed.addEventListener(()=>{const c=cam.positionCartographic;
  $('hud-pos').textContent=`${deg(C.Math.toDegrees(c.latitude),'N','S')} ${deg(C.Math.toDegrees(c.longitude),'E','W')} · ALT ${Math.round(c.height/1000).toLocaleString('en')} KM`});
cam.percentageChanged=0.01;
const tick=()=>{$('hud-utc').textContent=new Date().toISOString().slice(0,19).replace('T',' ')+' UTC'};tick();setInterval(tick,1000);

/* ---------- homicide rate by country (World Bank, live) ---------- */
const BINS=[[1,'#4a1016'],[2.5,'#6e141d'],[5,'#981a26'],[10,'#c42230'],[20,'#ec3d45'],[Infinity,'#ff8a80']];
const LABELS=['under 1','1 – 2.5','2.5 – 5','5 – 10','10 – 20','20 or more'];
let rates=null,countries=null;
const colour=r=>BINS.find(([max])=>r<max)[1];
async function loadRates(){
  const r=await fetch('https://api.worldbank.org/v2/country/all/indicator/VC.IHR.PSRC.P5?format=json&per_page=400&mrnev=1');
  if(!r.ok)throw new Error('HTTP '+r.status);
  const [,rows]=await r.json();const m={};(rows||[]).forEach(x=>{if(x.value!=null&&x.countryiso3code)m[x.countryiso3code]={v:x.value,y:x.date}});return m;
}
async function rateLayer(on){
  $('g-legend').hidden=$('g-table').hidden=!on;
  if(countries){countries.show=on;pulse(1500);return}
  if(!on)return;
  $('g-legend').innerHTML='<b>Loading rates from the World Bank…</b>';
  try{rates=await loadRates()}catch(err){$('g-legend').innerHTML=`<b>The rates could not be loaded right now (${esc(err.message)}).</b>`;$('g-rate').checked=false;return}
  /* one polygon per land mass, a thin layer 3 km above the surface and under the dots (8 km).
     Surface-clamped shapes need GPU features some devices lack, so they are not used. */
  countries=new C.CustomDataSource('homicide-rates');
  const ring=r=>C.Cartesian3.fromDegreesArray(r.slice(0,-1).flat());
  window.WORLD.features.forEach(f=>{
    const {name,iso3}=f.properties,d=iso3&&rates[iso3];
    const material=d?C.Color.fromCssColorString(colour(d.v)).withAlpha(.6):C.Color.fromCssColorString('#a3918d').withAlpha(.12);
    const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
    polys.forEach(([outer,...holes])=>countries.entities.add({
      properties:{name,iso3},
      polygon:{hierarchy:new C.PolygonHierarchy(ring(outer),holes.map(h=>new C.PolygonHierarchy(ring(h)))),
        material,height:3000,outline:false,arcType:C.ArcType.GEODESIC}
    }));
  });
  await viewer.dataSources.add(countries);pulse();
  /* one country can be several shapes (islands), so count and list each code once */
  const shown=new Map();window.WORLD.features.forEach(f=>{const iso=f.properties.iso3;if(iso&&rates[iso])shown.set(iso,{n:f.properties.name,d:rates[iso]})});
  const years=[...shown.values()].map(x=>+x.d.y),have=shown.size;
  $('g-legend').innerHTML=`<b>Intentional homicides per 100,000 people</b>
    <ol>${BINS.map(([,c],i)=>`<li><i style="background:${c}"></i>${LABELS[i]}</li>`).join('')}<li><i class="none"></i>no data</li></ol>
    <p>Latest year each country reported (${Math.min(...years)}–${Math.max(...years)}), ${have} countries. Countries record homicides differently, so compare with care: a rate describes recorded crime, not a place or its people.</p>
    <p class="src">Source: <a href="https://data.worldbank.org/indicator/VC.IHR.PSRC.P5" target="_blank" rel="noopener">World Bank</a>, from UNODC data, fetched live.</p>`;
  /* building the shapes can take a few seconds on slower devices */
  if(!viewer.dataSourceDisplay.ready){$('g-legend').insertAdjacentHTML('beforeend','<p id="g-busy">Drawing country shapes…</p>');
    const wait=setInterval(()=>{if(viewer.dataSourceDisplay.ready||!countries.show){clearInterval(wait);const b=$('g-busy');if(b)b.remove()}},300)}
  const rows=[...shown.values()].sort((a,b)=>b.d.v-a.d.v||a.n.localeCompare(b.n));
  $('g-table-body').innerHTML=`<table><thead><tr><th>Country</th><th>Per 100,000</th><th>Year</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.n)}</td><td>${x.d.v.toFixed(1)}</td><td>${esc(x.d.y)}</td></tr>`).join('')}</tbody></table>`;
  redraw();
}
function showRate(en,pos,sticky){
  const d=rates&&rates[en.properties.iso3.getValue()];
  tip.hidden=false;tip.textContent=`${en.properties.name.getValue()}: ${d?`${d.v.toFixed(1)} per 100,000 (${d.y})`:'no data'}`;place(pos);
  if(sticky)setTimeout(()=>{tip.hidden=true},2500);
}
$('g-rate').onchange=()=>rateLayer($('g-rate').checked);

render();setLook();focus();addEventListener('hashchange',focus);
})();
