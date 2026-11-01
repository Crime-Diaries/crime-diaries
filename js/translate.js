/* Translation help, on every page.
   1. A "Translate" button in the nav opens an animated, step-by-step guide showing how to translate the page with the
      browser's own translator (Chrome, Edge, Firefox, Safari, Chrome on Android, Safari on iPhone). The guide opens on
      the visitor's browser, and every other browser is one tab away.
   2. On library reports, CD.translateBar(...) adds "Read in [language]" that translates the report in place with the
      browser's built-in, on-device translator (Chrome 138+), free and without a server. Elsewhere it opens the guide.
   The mock browsers are drawn with plain shapes; menus are paraphrased and may look a little different on a given version. */
(()=>{
const esc=CD.esc,calm=()=>CD.calm();
const T='A<span>文</span>'; /* the translate glyph */

/* ---------- which browser is this ---------- */
function detect(){
  const ua=navigator.userAgent,brands=(navigator.userAgentData&&navigator.userAgentData.brands||[]).map(b=>b.brand).join(' ');
  const mobile=/Android|iPhone|iPad|iPod/i.test(ua)||(navigator.userAgentData&&navigator.userAgentData.mobile);
  if(/iPhone|iPad|iPod/i.test(ua))return 'ios';
  if(/Android/i.test(ua))return /Firefox/i.test(ua)?'firefox':'android';
  if(/Edg\//.test(ua)||/Edge/.test(brands))return 'edge';
  if(/Firefox\//.test(ua))return 'firefox';
  if(/Safari\//.test(ua)&&!/Chrome|Chromium/.test(ua))return 'safari';
  return mobile?'android':'chrome';
}

/* ---------- the guides: each step is a caption plus a scene drawn in a mock browser ---------- */
const GUIDES={
  chrome:{name:'Chrome',ui:'desktop',steps:[
    {cap:'Right-click anywhere on the page (on a Mac trackpad: tap with two fingers).',scene:'page'},
    {cap:'Choose “Translate to English”. The page changes language in place.',scene:'context',items:['Back','Reload','Save as…','Translate to English','Print…'],pick:3},
    {cap:'Want a different language? Click the translate icon in the address bar, then ⋮ and “Choose another language”.',scene:'bubble',items:['Japanese','English','⋮'],pick:2,
      menu:['Choose another language','Always translate Japanese','Never translate Japanese'],menuPick:0},
    {cap:'Pick any language from the list. Chrome remembers it for next time.',scene:'list',pick:'Hindi'},
    {cap:'Done: the page is now in your language. Click the icon again to show the original.',scene:'done'}]},
  edge:{name:'Edge',ui:'desktop',steps:[
    {cap:'Click the translate icon in the address bar. (Or right-click the page and choose “Translate to English”.)',scene:'icon'},
    {cap:'Choose the language you want under “Translate to”, then click Translate.',scene:'bubble',items:['Translate to:','English ▾','Translate'],pick:1,
      menu:['English','Hindi','Español','Français','中文'],menuPick:1},
    {cap:'Done. To go back, click the icon and choose “Show original”.',scene:'done'}]},
  firefox:{name:'Firefox',ui:'desktop',steps:[
    {cap:'Click the translation icon in the address bar. If you do not see it, open the menu ☰ and choose “Translate page…”.',scene:'icon',menuBtn:'☰'},
    {cap:'Set “To” to your language and click Translate. Firefox translates on your own computer.',scene:'bubble',items:['From: Japanese','To: English ▾','Translate'],pick:1,
      menu:['English','Hindi','Español','Français','Deutsch'],menuPick:0},
    {cap:'Done. Click the icon again to show the original page.',scene:'done'}]},
  safari:{name:'Safari (Mac)',ui:'desktop',steps:[
    {cap:'Click the Translate button in the address bar. (Older Safari: View menu, then Translation.)',scene:'icon'},
    {cap:'Choose “Translate to English”, or “Preferred Languages…” to add another language.',scene:'bubble',items:['Translate to English','Preferred Languages…'],pick:0},
    {cap:'Done. Click the button again and choose “View Original” to switch back.',scene:'done'}]},
  android:{name:'Chrome (Android)',ui:'phone',steps:[
    {cap:'Tap the menu ⋮ at the top right.',scene:'menu',menuBtn:'⋮',items:['New tab','History','Share…','Translate…','Desktop site'],pick:3},
    {cap:'A translate bar appears at the bottom. Tap your language, or ⋮ then “More languages”.',scene:'bar',items:['Japanese','English','⋮'],pick:1},
    {cap:'Done: the page is translated. Tap the original language in the bar to switch back.',scene:'done'}]},
  ios:{name:'Safari (iPhone)',ui:'phone',bottom:true,steps:[
    {cap:'Tap the “aA” button in the address bar (at the bottom or top of the screen).',scene:'menu',menuBtn:'aA',items:['Zoom 100%','Show Reader','Translate to English','Hide Toolbar','Website Settings'],pick:2},
    {cap:'Your iPhone translates into its own language. To choose others, go to Settings, then General, then Language & Region.',scene:'settings'},
    {cap:'Done. Tap “aA” again and choose “View Original” to switch back.',scene:'done'}]}
};
const ORDER=['chrome','edge','firefox','safari','android','ios'];
const FOREIGN=['神戸の事件の捜査は続いた。','警察は証拠を集め、目撃者に話を聞いた。','裁判所は判決を下した。'];
const ENGLISH=['The investigation of the Kobe case continued.','Police gathered evidence and spoke to witnesses.','The court delivered its verdict.'];

function sceneHTML(g,s){
  const phone=g.ui==='phone';
  const lines=(s.scene==='done'?ENGLISH:FOREIGN).map(t=>`<p>${esc(t)}</p>`).join('');
  const addr=`<div class="mb-addr${g.bottom?' bottom':''}"><span class="mb-url">crime-diaries · case</span>${g.bottom?'<b class="mb-btn" data-t="menu">aA</b>':`<b class="mb-btn mb-tr" data-t="icon">${T}</b><b class="mb-btn" data-t="menu">${esc(s.menuBtn||g.steps[0].menuBtn||'⋮')}</b>`}</div>`;
  let pop='';
  if(s.scene==='context')pop=`<ul class="mb-pop ctx" style="left:38%;top:44%">${s.items.map((t,i)=>`<li${i===s.pick?' data-pick':''}>${esc(t)}</li>`).join('')}</ul>`;
  if(s.scene==='bubble')pop=`<div class="mb-pop bub"><div class="bub-row">${s.items.map((t,i)=>`<span${i===s.pick?' data-pick':''}>${esc(t)}</span>`).join('')}</div>${s.menu?`<ul class="bub-menu">${s.menu.map((t,i)=>`<li${i===s.menuPick?' data-pick2':''}>${esc(t)}</li>`).join('')}</ul>`:''}</div>`;
  if(s.scene==='list')pop=`<div class="mb-pop bub list"><b>Choose a language</b><ul>${['English','Español','हिन्दी Hindi','Français','中文','العربية'].map(t=>`<li${t.includes(s.pick)?' data-pick':''}>${esc(t)}</li>`).join('')}</ul></div>`;
  if(s.scene==='menu')pop=`<ul class="mb-pop menu${g.bottom?' up':''}">${s.items.map((t,i)=>`<li${i===s.pick?' data-pick':''}>${esc(t)}</li>`).join('')}</ul>`;
  if(s.scene==='bar')pop=`<div class="mb-pop tbar">${T} ${s.items.map((t,i)=>`<span${i===s.pick?' data-pick':''}>${esc(t)}</span>`).join('')}</div>`;
  if(s.scene==='settings')pop=`<div class="mb-pop bub list"><b>Settings › General › Language &amp; Region</b><ul><li>iPhone Language: English</li><li data-pick>Add Language…</li></ul></div>`;
  const target=s.scene==='page'||s.scene==='context'?'page':s.scene==='icon'||(s.scene==='bubble'||s.scene==='list')&&g.ui==='desktop'?'icon':s.scene==='menu'?'menu':'';
  return `<div class="mock ${phone?'phone':'desktop'}${s.scene==='done'?' is-done':''}" data-target="${target}">
    ${g.bottom?'':addr}<div class="mb-page">${s.scene==='done'?`<span class="mb-badge">${T} Translated</span>`:''}<h4>${s.scene==='done'?'The case':'事件の概要'}</h4>${lines}</div>${g.bottom?addr:''}
    ${pop}<i class="mb-pointer" aria-hidden="true"></i></div>`;
}

/* ---------- the guide dialog ---------- */
let dlg,key='chrome',at=0,auto=null,opener=null,timers=[];
function play(){
  timers.forEach(clearTimeout);timers=[];
  const g=GUIDES[key],s=g.steps[at],stage=dlg.querySelector('.tg-stage');
  stage.innerHTML=sceneHTML(g,s);
  dlg.querySelector('.tg-cap').textContent=s.cap;
  dlg.querySelector('.tg-n').textContent=`Step ${at+1} of ${g.steps.length}`;
  dlg.querySelector('.tg-dots').innerHTML=g.steps.map((_,i)=>`<button aria-label="Step ${i+1}"${i===at?' aria-current="step"':''}></button>`).join('');
  dlg.querySelector('#tg-prev').disabled=at===0;
  dlg.querySelector('#tg-next').textContent=at===g.steps.length-1?'Start again':'Next ›';
  const m=stage.querySelector('.mock'),ptr=m.querySelector('.mb-pointer'),t=m.dataset.target;
  const aim=sel=>{const el=m.querySelector(sel);if(!el)return;const a=el.getBoundingClientRect(),b=m.getBoundingClientRect();
    ptr.style.left=(a.left-b.left+a.width/2)+'px';ptr.style.top=(a.top-b.top+a.height/2)+'px'};
  const end=()=>{m.classList.add('show','picked','picked2');const p2=m.querySelector('[data-pick2]')||m.querySelector('[data-pick]');if(p2)aim(p2.matches('[data-pick2]')?'[data-pick2]':'[data-pick]');else if(t)aim(t==='page'?'.mb-page p:nth-child(3)':`[data-t="${t}"]`);else ptr.hidden=true};
  if(calm()){end();return}
  /* pointer starts low on the page, moves to the target, clicks, the menu opens, then it moves to the right item */
  ptr.style.left='70%';ptr.style.top='85%';
  const at_=(ms,f)=>timers.push(setTimeout(f,ms));
  at_(150,()=>{if(t)aim(t==='page'?'.mb-page p:nth-child(3)':`[data-t="${t}"]`);else ptr.hidden=true});
  at_(1150,()=>{ptr.classList.add('click');m.classList.add('show')});
  at_(1500,()=>ptr.classList.remove('click'));
  at_(1800,()=>{if(m.querySelector('[data-pick]')){aim('[data-pick]')}});
  at_(2700,()=>{if(m.querySelector('[data-pick]')){ptr.classList.add('click');m.classList.add('picked')}});
  at_(3000,()=>ptr.classList.remove('click'));
  at_(3300,()=>{if(m.querySelector('[data-pick2]'))aim('[data-pick2]')});
  at_(4100,()=>{if(m.querySelector('[data-pick2]')){ptr.classList.add('click');m.classList.add('picked2')}});
}
const go=i=>{const n=GUIDES[key].steps.length;at=(i+n)%n;play()};
function setAuto(on){
  clearInterval(auto);auto=null;const b=dlg.querySelector('#tg-auto');
  if(on&&!calm()){auto=setInterval(()=>go(at+1),5200);b.textContent='❚❚ Pause';b.setAttribute('aria-pressed','true')}
  else{b.textContent='▶ Play';b.setAttribute('aria-pressed','false')}
}
function build(){
  dlg=document.createElement('div');dlg.className='tguide';dlg.hidden=true;
  dlg.setAttribute('role','dialog');dlg.setAttribute('aria-modal','true');dlg.setAttribute('aria-labelledby','tg-title');
  dlg.innerHTML=`<div class="tg-card">
    <div class="tg-top"><h2 id="tg-title">${T} Read this site in your language</h2><button class="ask-x" id="tg-x" aria-label="Close">×</button></div>
    <p class="tg-intro">Your browser can translate any page for free, on your own device. Pick your browser and follow the steps.</p>
    <div class="tg-tabs" role="tablist">${ORDER.map(k=>`<button role="tab" data-k="${k}">${esc(GUIDES[k].name)}</button>`).join('')}</div>
    <div class="tg-stage" aria-hidden="true"></div>
    <p class="tg-cap" aria-live="polite"></p>
    <div class="tg-nav"><button class="ghost" id="tg-prev">‹ Back</button><span class="tg-n"></span><span class="tg-dots"></span><button class="ghost" id="tg-auto" aria-pressed="false">▶ Play</button><button class="d-send" id="tg-next">Next ›</button></div>
    <p class="src">Menus can look slightly different on your browser version. If your browser offers no translation, use the “Read it translated” link on the report, which opens Google Translate.</p>
  </div>`;
  document.body.appendChild(dlg);
  dlg.querySelector('.tg-tabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;key=b.dataset.k;at=0;tabs();play()};
  dlg.querySelector('.tg-dots').onclick=e=>{const b=e.target.closest('button');if(b)go([...b.parentNode.children].indexOf(b))};
  dlg.querySelector('#tg-prev').onclick=()=>{setAuto(false);go(at-1)};
  dlg.querySelector('#tg-next').onclick=()=>{setAuto(false);go(at+1)};
  dlg.querySelector('#tg-auto').onclick=()=>setAuto(!auto);
  dlg.querySelector('#tg-x').onclick=close;
  dlg.onclick=e=>{if(e.target===dlg)close()};
  dlg.addEventListener('keydown',e=>{
    if(e.key==='Escape')close();
    else if(e.key==='ArrowRight'&&!e.target.closest('.tg-tabs')){setAuto(false);go(at+1)}
    else if(e.key==='ArrowLeft'&&!e.target.closest('.tg-tabs')){setAuto(false);go(at-1)}
    else if(e.key==='Tab'){const f=[...dlg.querySelectorAll('button:not(:disabled),a')],i=f.indexOf(document.activeElement);
      if(e.shiftKey&&i<=0){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&i===f.length-1){e.preventDefault();f[0].focus()}}
  });
  document.addEventListener('cd:calm',()=>{if(!dlg.hidden){setAuto(false);play()}});
}
const tabs=()=>dlg.querySelectorAll('.tg-tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.k===key));
function open(){
  if(!dlg)build();
  opener=document.activeElement;key=detect();at=0;dlg.hidden=false;document.body.classList.add('gate-on');tabs();play();setAuto(true);
  dlg.querySelector('.tg-tabs [aria-selected="true"]').focus();
}
function close(){setAuto(false);timers.forEach(clearTimeout);dlg.hidden=true;document.body.classList.remove('gate-on');if(opener&&opener.focus)opener.focus()}

/* nav button on every page */
const calmBtn=document.getElementById('calm');
if(calmBtn){const b=document.createElement('button');b.className='ghost tr-btn';b.id='tr-open';b.title='Read this site in your language';
  b.setAttribute('aria-label','Translate: how to read this site in your language');b.innerHTML=T;b.onclick=open;calmBtn.before(b)}

/* ---------- in-page translation of a library report (Chrome's on-device Translator) ---------- */
const TARGETS=[['en','English'],['hi','हिन्दी Hindi'],['bn','বাংলা Bengali'],['ta','தமிழ் Tamil'],['te','తెలుగు Telugu'],['mr','मराठी Marathi'],
  ['ur','اردو Urdu'],['es','Español'],['fr','Français'],['de','Deutsch'],['pt','Português'],['it','Italiano'],['ru','Русский'],
  ['ja','日本語'],['ko','한국어'],['zh','中文'],['ar','العربية'],['tr','Türkçe'],['id','Bahasa Indonesia'],['vi','Tiếng Việt']];
/* bar: element to fill; rep: {lang, lead, secs, draw(lead, secs, opts)} from report.js */
CD.translateBar=(bar,rep)=>{
  const base=(navigator.language||'en').split('-')[0];
  let want=TARGETS.some(t=>t[0]===base)&&base!==rep.lang?base:(rep.lang==='en'?'hi':'en');
  bar.innerHTML=`<label>${T} Read in <select id="tr-to" aria-label="Language to translate the report into">${TARGETS.filter(t=>t[0]!==rep.lang).map(([c,n])=>`<option value="${c}"${c===want?' selected':''}>${esc(n)}</option>`).join('')}</select></label>
    <button class="d-send" id="tr-go">Translate</button><button class="ghost" id="tr-orig" hidden>Show original</button>
    <button class="ghost" id="tr-how">How to use your browser's translator</button><span class="src" id="tr-msg" aria-live="polite"></span>`;
  const msg=t=>{bar.querySelector('#tr-msg').textContent=t};
  bar.querySelector('#tr-how').onclick=open;
  bar.querySelector('#tr-orig').onclick=()=>{rep.draw(rep.lead,rep.secs,{lang:rep.lang});bar.querySelector('#tr-orig').hidden=true;msg('')};
  bar.querySelector('#tr-go').onclick=async()=>{
    const to=bar.querySelector('#tr-to').value;
    if(!('Translator' in self)){msg('Your browser has no built-in translator for this button. Here is how to use its own translate menu.');open();return}
    try{
      msg('Checking your browser’s translator…');
      /* some browsers expose the API but never answer: give up after 4 seconds and show the guide instead */
      const ok=await Promise.race([Translator.availability({sourceLanguage:rep.lang,targetLanguage:to}),new Promise(r=>setTimeout(()=>r('unavailable'),4000))]);
      if(ok==='unavailable'){msg('Your browser cannot translate this pair of languages here. Try its translate menu instead.');open();return}
      msg(ok==='available'?'Translating…':'Downloading the language pack, then translating…');
      const tr=await Translator.create({sourceLanguage:rep.lang,targetLanguage:to,monitor(m){m.addEventListener('downloadprogress',e=>msg(`Downloading the language pack… ${Math.round(e.loaded*100)}%`))}});
      const one=async s=>{try{return await tr.translate(s)}catch{return s}};
      const lead=rep.lead&&{...rep.lead,body:await Promise.all(rep.lead.body.map(one))};
      const secs=[];for(const s of rep.secs)secs.push({...s,h:await one(s.h),body:await Promise.all(s.body.map(one))});
      /* translated into English, the violence check can read the text, so only flagged sections stay collapsed */
      rep.draw(lead,secs,{lang:to,machine:true,checkable:to==='en'});
      bar.querySelector('#tr-orig').hidden=false;
      msg(`Machine translation by your browser, on your device. It can get names and legal terms wrong.`);
    }catch(err){msg('Translation did not work here. Here is how to use your browser’s own translate menu.');open()}
  };
};
CD.translateGuide=open;
})();
