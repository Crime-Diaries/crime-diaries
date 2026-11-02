/* The full report on a library page (case.html?wd=Q…): the whole Wikipedia article, section by section, on our
   own page, plus a fact box and a gallery of safe, freely licensed images. Exposes CD.report and CD.gallery.

   Rules (see about.html):
   - Plain text only: Wikipedia's text is inserted with textContent, never as HTML.
   - Sections that may describe how a victim died are collapsed behind a warning; the reader chooses to open them.
     In articles not in English the check cannot read the text, so every section after the introduction is collapsed.
   - Reference lists and link sections are left out.
   - Images: only files on Wikimedia Commons with a free licence; never "fair use" images, never files whose name,
     description or categories suggest a body, injury, weapon, crime scene, a person's portrait, an offender or a child.
     Hidden until the visitor asks to see them. */
(()=>{
const esc=CD.esc;
const api=(lang,p)=>fetch(`https://${lang}.wikipedia.org/w/api.php?`+new URLSearchParams({format:'json',formatversion:2,origin:'*',...p}))
  .then(r=>r.ok?r.json():Promise.reject(new Error('HTTP '+r.status)));
const text=html=>{try{return (new DOMParser().parseFromString(String(html||''),'text/html').body.textContent||'').replace(/\s+/g,' ').trim()}catch{return ''}};

/* section headings that are only lists of links or references, in the main languages */
const OMIT=/^(references?|notes?|citations|sources|bibliography|further reading|external links|see also|footnotes|notes and references|works cited|referencias|enlaces externos|véase también|bibliografía|notas|references|références|liens externes|voir aussi|notes et références|bibliographie|einzelnachweise|weblinks|literatur|siehe auch|anmerkungen|collegamenti esterni|voci correlate|bibliografia|referências|ligações externas|ver também|bronnen|externe links|zie ook|przypisy|linki zewnętrzne|bibliografia|примечания|ссылки|литература|см\. также|脚注|関連項目|外部リンク|参考文献|出典|注釈|参考资料|外部链接|参见|각주|외부 링크|같이 보기|المراجع|وصلات خارجية|انظر أيضا|הערות שוליים|קישורים חיצוניים|ראו גם)$/i;
/* words that suggest a passage describes how someone died or was hurt (English articles) */
const GRAPHIC=/stabb|strangl|dismember|decapitat|behead|autops|post-?mortem|\bwounds?\b|bludgeon|burn(ed|t) alive|suffocat|asphyxi|throat|mutilat|tortur|gunshot|shot (him|her|them|dead|in the)|bled to death|cause of death|bod(y|ies) (was|were|of)|corpse|remains (were|was)|skull|blunt[- ](force|trauma)|knife|hammer|\baxe\b|acid attack|set (her|him|them) (on fire|alight)|drown|severed|naked|rape|sexual|beaten to death|hacked|slit|disembowel/i;
const NOTORIETY=/perpetrator|attacker|assailant|gunm[ae]n|shooter|bomber|hijacker|terrorist|militant|manifesto|motiv|ideolog|planning|preparation|weapon|tactic|method|early life|personal life|background of|biograph|the attack|timeline|sequence of events|events|course of/i;
const GRAPHIC_HEAD=/autops|post-?mortem|cause of death|injur|wound|murder|killing|death|body|bodies|discovery|crime scene|tortur|execution|attack|assault/i;

function sections(extract){
  const out=[{h:'',level:1,body:[]}];
  for(const line of String(extract||'').split('\n')){
    const m=/^(={2,6})\s*(.*?)\s*\1$/.exec(line.trim());
    if(m)out.push({h:m[2],level:m[1].length,body:[]});
    else if(line.trim())out[out.length-1].body.push(line.trim());
  }
  /* a heading whose parent is omitted is omitted too */
  let skip=0;
  return out.filter(s=>{if(s.h&&s.level<=skip)skip=0;if(s.h&&OMIT.test(s.h)){skip=s.level;return false}return !skip&&(s.body.length||s.h)});
}

/* ---------- images ---------- */
const BAD_IMG=/bod(y|ies)|corpse|cadaver|\bdead\b|death|blood|autops|crime scene|murder scene|weapon|knife|knives|\bguns?\b|rifle|pistol|revolver|bullet|mug ?shot|booking photo|prisoner|convict|murderer|criminal|perpetrator|suspect|offender|gangster|executed|execution|hang(ed|ing)|gallows|noose|electric chair|wound|injur|skull|bones|remains|coffin|casket|funeral|grave|tomb|cemetery|victim|child|children|\bgirls?\b|\bboys?\b|baby|portrait|headshot|\bface\b|\bpeople\b|\bperson\b|\b(wo)?m[ae]n\b|police photo|evidence|torture|riot|massacre|explosi|flag|coat of arms|logo|icon|symbol|emblem|signature|seal of/i;
const OK_MIME=/^image\/(jpeg|png|webp|gif)$/;
async function images(lang,title){
  const j=await api(lang,{action:'query',generator:'images',gimlimit:50,titles:title,redirects:1,prop:'imageinfo',
    iiprop:'url|extmetadata|mime|size',iiurlwidth:640,iiextmetadatafilter:'LicenseShortName|LicenseUrl|Artist|ImageDescription|ObjectName|Categories|NonFree'});
  return ((j.query&&j.query.pages)||[]).map(p=>{
    const i=(p.imageinfo||[])[0]||{},m=i.extmetadata||{},g=k=>m[k]&&m[k].value;
    return {title:p.title,repo:p.imagerepository,mime:i.mime,w:i.width,h:i.height,thumb:i.thumburl,page:i.descriptionurl,
      lic:text(g('LicenseShortName')),licUrl:g('LicenseUrl'),artist:text(g('Artist')),desc:text(g('ImageDescription')),
      name:text(g('ObjectName')),cats:text(g('Categories')),nonfree:g('NonFree')};
  }).filter(x=>x.repo==='shared'&&OK_MIME.test(x.mime||'')&&x.w>=300&&x.h>=200&&x.thumb&&!x.nonfree&&x.lic&&!/fair use|non-?free/i.test(x.lic)
    &&!BAD_IMG.test([x.title,x.name,x.desc,x.cats].join(' ')))
   .sort((a,b)=>a.title.localeCompare(b.title)).slice(0,6);
}
/* gallery(box, lang, title): fills box with a hidden-by-default gallery; nothing at all if no image passes */
async function gallery(box,lang,title){
  let list;try{list=await images(lang,title)}catch{return}
  if(!list.length){box.remove();return}
  const show=()=>{
    box.innerHTML=`<div class="g-head"><b>Images</b><button class="ghost" id="img-hide">Hide images</button></div>
      <div class="gal">${list.map(x=>`<figure><a href="${esc(x.page)}" target="_blank" rel="noopener"><img src="${esc(x.thumb)}" alt="${esc(x.desc||x.name||'Image from the article')}" loading="lazy"></a>
        <figcaption>${esc((x.desc||x.name||'').slice(0,160))}<small>${esc(x.artist?x.artist.slice(0,80)+', ':'')}<a href="${esc(x.licUrl||x.page)}" target="_blank" rel="noopener">${esc(x.lic)}</a>, via <a href="${esc(x.page)}" target="_blank" rel="noopener">Wikimedia Commons</a></small></figcaption></figure>`).join('')}</div>
      <p class="src">Freely licensed images only, chosen automatically. We leave out portraits, offenders, weapons, crime scenes and anything that suggests injury or death. If an image here should not be, <a href="https://github.com/preetsaini2004/crime-diaries/issues/new?title=${encodeURIComponent('Image on '+title)}" target="_blank" rel="noopener">report it</a>.</p>`;
    box.querySelector('#img-hide').onclick=()=>{CD.store.set('cd_imgs','0');hide()};
  };
  const hide=()=>{
    box.innerHTML=`<div class="g-head"><b>Images</b><span class="src">${list.length} freely licensed image${list.length>1?'s':''} from Wikimedia Commons, hidden until you choose to see them.</span><button class="ghost" id="img-show">Show images</button></div>`;
    box.querySelector('#img-show').onclick=()=>{CD.store.set('cd_imgs','1');show()};
  };
  CD.store.get('cd_imgs')==='1'?show():hide();
}

/* ---------- the report ---------- */
async function report(el,e){
  const lang=e.l||'en',title=e.w.replace(/_/g,' '),wiki=CD.wiki(e),lname=CD.langName(lang);
  const rtl=/^(ar|he|fa|ur|ps|yi|ckb|sd|ug|dv|arz|azb|mzn)$/.test(lang);
  const translate=`https://translate.google.com/translate?sl=${lang}&tl=en&u=${encodeURIComponent(wiki)}`;
  const history=`https://${lang}.wikipedia.org/w/index.php?title=${encodeURIComponent(e.w)}&action=history`;
  const body=el.querySelector('#report'),facts=el.querySelector('#facts');
  let page;
  try{
    const j=await api(lang,{action:'query',titles:title,redirects:1,prop:'extracts|revisions|langlinks',explaintext:1,
      exsectionformat:'wiki',rvprop:'timestamp',lllimit:'max',llprop:'langname'});
    page=j.query&&j.query.pages&&j.query.pages[0];
    if(!page||page.missing||!page.extract)throw new Error('missing');
  }catch{
    body.innerHTML=`<p class="lead">${esc(e.d||'')} The article could not be loaded right now. <a href="${wiki}" target="_blank" rel="noopener">Read it on Wikipedia</a>.</p>`;return;
  }
  const edited=page.revisions&&page.revisions[0]&&page.revisions[0].timestamp;
  const others=(page.langlinks||[]).sort((a,b)=>(a.langname||a.lang).localeCompare(b.langname||b.lang));
  facts.insertAdjacentHTML('beforeend',`<dt>Article</dt><dd>${esc(lname)} Wikipedia${edited?`, last edited ${esc(edited.slice(0,10))}`:''}</dd>
    ${others.length?`<dt>Also in</dt><dd>${others.length} other language${others.length>1?'s':''}: <select id="f-lang" aria-label="Read this case in another language"><option value="">choose…</option>${others.map(o=>`<option value="${esc(o.lang)}|${esc(o.title)}">${esc(o.langname||o.lang)}</option>`).join('')}</select></dd>`:''}`);
  const fl=el.querySelector('#f-lang');
  if(fl)fl.onchange=()=>{const [l,t]=fl.value.split('|');if(l)window.open(`https://${l}.wikipedia.org/wiki/${encodeURIComponent(t.replace(/ /g,'_'))}`,'_blank','noopener')};

  const secs=sections(page.extract),lead=secs[0]&&!secs[0].h?secs.shift():null;
  let hidden=0;
  /* draw the report; called again with translated text by the translate bar (js/translate.js) */
  function draw(lead,secs,o){
  const english=o.checkable!==undefined?o.checkable:o.lang==='en',shown=o.lang,shownName=CD.langName(shown);
  hidden=0;
  const frag=document.createDocumentFragment();
  if(o.machine){const n=document.createElement('p');n.className='notice machine';n.textContent=`Machine translation into ${shownName} by your browser. It can get names and legal terms wrong; the original is one click away.`;frag.appendChild(n)}
  const para=(parent,lines)=>lines.forEach(t=>{const p=document.createElement('p');p.textContent=t;parent.appendChild(p)});
  if(lead){const d=document.createElement('div');d.className='lead-text';para(d,lead.body);frag.appendChild(d)}
  if(secs.length){
    const toc=document.createElement('nav');toc.className='toc';toc.setAttribute('aria-label','Sections');
    toc.innerHTML='<b>In this report</b><ol>'+secs.filter(s=>s.level===2).map((s,i)=>`<li><a href="#s-${i}">${esc(s.h)}</a></li>`).join('')+'</ol>';
    frag.appendChild(toc);
  }
  let top=-1;
  secs.forEach(s=>{
    const wrap=document.createElement('section');wrap.className='r-sec lvl'+s.level;
    if(s.level===2){top++;wrap.id='s-'+top}
    const h=document.createElement(s.level===2?'h2':'h3');h.textContent=s.h;wrap.appendChild(h);
    /* attack cases: sections about the attacker or the method stay closed ("No Notoriety") */
    const notoriety=e.x==='attack'&&NOTORIETY.test(s.h)&&s.body.length>0;
    const graphic=notoriety||!english||GRAPHIC.test(s.body.join(' '))||(GRAPHIC_HEAD.test(s.h)&&s.body.length>0);
    if(graphic&&s.body.length){
      hidden++;
      const det=document.createElement('details');det.className='sensitive';
      const sum=document.createElement('summary');
      sum.textContent=notoriety?'This section is about the attacker or how the attack was carried out. We keep it closed so attackers do not get the attention they wanted.':english?'This section may describe violence or how a victim died. Open it only if you want to read it.'
        :`This section has not been checked for violent detail (it is in ${shownName}). Open it only if you want to read it.`;
      det.appendChild(sum);para(det,s.body);wrap.appendChild(det);
    }else para(wrap,s.body);
    frag.appendChild(wrap);
  });
  const isRtl=/^(ar|he|fa|ur|ps|yi|ckb|sd|ug|dv|arz|azb|mzn)$/.test(shown);
  body.textContent='';body.setAttribute('lang',shown);if(isRtl)body.setAttribute('dir','rtl');else body.removeAttribute('dir');body.appendChild(frag);
  }
  draw(lead,secs,{lang});
  const bar=el.querySelector('#trbar');
  if(bar&&CD.translateBar)CD.translateBar(bar,{lang,lead,secs,draw});
  el.querySelector('#wattr').innerHTML=`Text: “<a href="${wiki}" target="_blank" rel="noopener">${esc(page.title)}</a>”, ${esc(lname)} Wikipedia, by its contributors (<a href="${history}" target="_blank" rel="noopener">history</a>), licensed <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>. Changes by Crime Diaries: split into sections, reference and link lists left out${hidden?`, ${hidden} section${hidden>1?'s':''} collapsed behind a warning`:''}. Fetched live${edited?`; article last edited ${esc(edited.slice(0,10))}`:''}.${lang==='en'?'':` <a href="${translate}" target="_blank" rel="noopener">Read it translated</a>.`}`;
}

CD.report=report;CD.gallery=gallery;
})();
