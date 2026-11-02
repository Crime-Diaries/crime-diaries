/* Sensitive cases (data/sensitive.js): terror attacks, massacres, riots, mass killings, lynchings ('attack'), and
   PROTECTED cases: sexual violence ('sexual') and cases involving a child in India ('child').
   - Nothing about a sensitive case is fetched or shown until the reader has read the content warning and guidelines
     and ticked both boxes. The warning shows every time such a case is opened.
   - Attack cases then show the full report, with sections about the attacker or the method kept closed
     (the "No Notoriety" practice), because detailed coverage of attackers is linked to copycat attacks.
   - Protected cases never show the victim's identity, which is a crime to publish in India and many other countries
     whatever the reader agreed to: no Wikipedia text except trial and outcome sentences with names removed, no images,
     and only people Wikidata records as convicted adults. Exposes CD.warn and CD.protectedPage. */
(()=>{
const esc=CD.esc,$=id=>document.getElementById(id);
const api=(host,p)=>fetch(`https://${host}/w/api.php?`+new URLSearchParams({format:'json',formatversion:2,origin:'*',...p})).then(r=>r.ok?r.json():Promise.reject(new Error('HTTP '+r.status)));

const KIND={
  attack:{title:'Content warning: mass violence',
    what:'This case is about a terror attack, massacre, riot or other act of mass violence. It describes the deaths of many people.',
    extra:['Sections about the attacker, their motives or how the attack was carried out stay closed. We do not give attackers the attention they wanted.']},
  sexual:{title:'Content warning: sexual violence',
    what:'This case involves sexual violence. The page is protected: the victim is never named or described, by law and out of respect.',
    extra:['We show only the date, the country, people a court convicted, and what the courts and lawmakers did.','The full Wikipedia article is linked, not shown. It may name the victim, so please never repeat or share a victim’s identity.']},
  child:{title:'Content warning: a case involving a child',
    what:'This case involves a child. The page is protected: the child is never named or described, as Indian law requires.',
    extra:['We show only the date, the country, adults a court convicted, and what the courts did.','The full Wikipedia article is linked, not shown.']}
};

/* resolves true once the reader accepts; "Go back" leaves the page */
CD.warn=x=>new Promise(ok=>{
  const k=KIND[x]||KIND.attack,box=document.createElement('div');
  box.className='notice-gate cw';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-labelledby','cw-title');
  box.innerHTML=`<div class="ng-card">
    <p class="ng-kicker">Sensitive case</p>
    <h2 id="cw-title">${esc(k.title)}</h2>
    <p>${esc(k.what)}</p>
    <p><b>Before you continue, please read our guidelines:</b></p>
    <ul>
      <li>Crime Diaries is for education only. We do not promote, glorify or condone violence or any crime.</li>
      <li>Behind this case are real victims, families and communities. Read and discuss with respect.</li>
      <li>Never name or identify a victim of sexual violence or a child, and never contact victims, families or witnesses.</li>
      <li>Never call a living person guilty unless a court has convicted them.</li>
      ${k.extra.map(t=>`<li>${esc(t)}</li>`).join('')}
    </ul>
    <label class="cw-ok"><input type="checkbox" id="cw-1"> I have read the guidelines and I will follow them.</label>
    <label class="cw-ok"><input type="checkbox" id="cw-2"> I understand this case describes real harm, and I choose to read it.</label>
    <p class="ng-help">If this brings up difficult feelings, you can stop at any time. Support lines are listed on our <a href="about.html#help">principles page</a>.</p>
    <div class="ng-row"><button class="ng-go" id="cw-go" disabled>Open the case</button><button class="ng-alt" id="cw-back">Go back</button></div>
  </div>`;
  document.body.appendChild(box);document.body.classList.add('gate-on');
  const go=box.querySelector('#cw-go'),c1=box.querySelector('#cw-1'),c2=box.querySelector('#cw-2');
  const upd=()=>{go.disabled=!(c1.checked&&c2.checked)};c1.onchange=c2.onchange=upd;
  c1.focus();
  box.addEventListener('keydown',e=>{if(e.key==='Escape')back();if(e.key!=='Tab')return;
    const f=[...box.querySelectorAll('input,button:not(:disabled),a')],i=f.indexOf(document.activeElement);
    if(e.shiftKey&&i<=0){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&i===f.length-1){e.preventDefault();f[0].focus()}});
  const back=()=>{if(history.length>1&&document.referrer&&new URL(document.referrer).origin===location.origin)history.back();else location.href='library.html'};
  box.querySelector('#cw-back').onclick=back;
  go.onclick=()=>{box.remove();document.body.classList.remove('gate-on');ok(true)};
});

/* ---------- protected page ---------- */
/* words kept when names are removed from outcome sentences; any other capitalised word becomes "[name withheld]" */
const KEEP=new Set(`a an the in on at to of for and or but by with from as after before during since until while when where which who that this these those
he she they it its his her their them there then thus also however following later both all each other another some several many one two three four five six seven eight nine ten
january february march april may june july august september october november december monday tuesday wednesday thursday friday saturday sunday
court courts supreme high district sessions session fast track tribunal bench judge judges justice justices chief magistrate jury trial trials appeal appeals verdict judgment judgement
police polices bureau central investigation investigating agency cbi fbi crime branch department ministry minister government state states union national federal parliament assembly
act acts amendment amendments code penal criminal law laws section sections article articles bill ordinance constitution rules commission committee inquiry report
indian india british english american prosecution prosecutor prosecutors defence defense counsel lawyer lawyers advocate public attorney general solicitor
president governor prime home affairs legislative lok sabha rajya
death life imprisonment sentence sentenced convicted acquitted guilty charges charged accused bail parole remission pardon appeal petition plea review curative
on january`.split(/\s+/));
const OUTCOME_HEAD=/trial|verdict|judg|sentenc|court|appeal|convict|acquit|legal|aftermath|legislat|reform|\blaw|impact|investigation|arrest|prosecution|proceedings|execution|death warrant|mercy|remission|release/i;
const OUTCOME_SENT=/convict|acquit|sentenc|verdict|upheld|appeal|court|trial|charge|arrest|\blaw\b|\bact\b|amend|reform|execut|hanged|bail|guilty|investigat|parole|remission|petition/i;
const GRAPHIC=/stabb|strangl|dismember|decapitat|behead|autops|post-?mortem|\bwounds?\b|bludgeon|burn(ed|t) alive|suffocat|asphyxi|throat|mutilat|tortur|gunshot|bled|cause of death|bod(y|ies)|corpse|remains|skull|blunt|knife|rod\b|iron|hammer|acid|naked|undress|genital|intestin|organ|penetrat|assault(ed)? her|raped|rape of|molest|inserted|semen|blood|injur|hospital/i;
const sentences=t=>String(t).replace(/\s+/g,' ').match(/[^.!?]+[.!?]+(\s|$)/g)||[];
function redact(sentence,keep){
  return sentence.replace(/\b[A-Z][\p{L}'’\-]*(?:\s+[A-Z][\p{L}'’\-]*)*/gu,m=>m.split(/\s+/).every(w=>KEEP.has(w.toLowerCase().replace(/['’]s$/,''))||keep.has(w.toLowerCase().replace(/['’]s$/,'')))?m:'[name withheld]')
    .replace(/(\[name withheld\][\s,]*){2,}/g,'[name withheld] ');
}
async function wd(ids,props){
  const j=await api('www.wikidata.org',{action:'wbgetentities',ids:ids.join('|'),props,languages:'en'});return j.entities||{};
}
const yearOf=c=>{const v=c&&c[0]&&c[0].mainsnak.datavalue;return v?parseInt(v.value.time,10):null};

CD.protectedPage=async(el,e)=>{
  const k=KIND[e.x];
  const wikiLink=`https://www.wikidata.org/wiki/Special:GoToLinkedPage/${e.l||'en'}wiki/${encodeURIComponent(e.q)}`;
  el.classList.add('wide');
  el.innerHTML=`<p class="crumbs"><a href="library.html">← Library</a> / ${esc(e.q)}</p>
    <span class="tag sens-tag">PROTECTED CASE</span>
    <h1>${esc(e.t)}</h1>
    <div class="notice imported"><b>Protected.</b> ${esc(k.what)} Names other than those of convicted adults are removed automatically below; if you see a victim’s name or a detail that could identify them, <a href="https://github.com/preetsaini2004/crime-diaries/issues/new?title=${encodeURIComponent('Protected case '+e.q+': identifying detail')}" target="_blank" rel="noopener">report it</a> and we will remove it.</div>
    <div class="r-grid"><div class="r-main">
      <h2>People convicted</h2><div id="pc-people"><p class="src">Checking court outcomes recorded on Wikidata…</p></div>
      <h2>What the courts and lawmakers did</h2><div id="pc-outcome" class="report"><p class="src">Loading…</p></div>
      <h2>Read further</h2><p><a href="${wikiLink}" target="_blank" rel="noopener">Read the full article on Wikipedia</a>. It is not shown here because it may name the victim. Please never repeat or share a victim’s identity.</p>
    </div>
    <aside class="facts" aria-label="Case facts"><b>Case facts</b><dl id="facts">
      <dt>Type</dt><dd>${esc(e.k)}</dd><dt>Year</dt><dd>${CD.year(e.y)}</dd><dt>Country</dt><dd>${esc(e.c||'Not recorded')}</dd>
      <dt>Place</dt><dd>Withheld to protect the victim</dd><dt>Record</dt><dd><a href="https://www.wikidata.org/wiki/${esc(e.q)}" target="_blank" rel="noopener">Wikidata ${esc(e.q)}</a></dd>
    </dl></aside></div>`;

  /* people: only perpetrators (P8031) Wikidata records as convicted (P1399) and as 18 or older at the time */
  const keep=new Set((e.c||'').toLowerCase().split(/\s+/));
  try{
    const item=(await wd([e.q],'claims'))[e.q]||{},cl=item.claims||{};
    const evYear=yearOf(cl.P585)||yearOf(cl.P580)||e.y;
    const pids=(cl.P8031||[]).map(c=>c.mainsnak.datavalue&&c.mainsnak.datavalue.value.id).filter(Boolean).slice(0,30);
    const people=pids.length?await wd(pids,'labels|claims'):{};
    const shown=[],convIds=new Set();let hiddenN=0;
    for(const id of pids){
      const p=people[id];if(!p){hiddenN++;continue}
      const born=yearOf(p.claims&&p.claims.P569),conv=(p.claims&&p.claims.P1399)||[];
      if(!conv.length||!born||evYear-born<18){hiddenN++;continue}
      const name=p.labels&&p.labels.en&&p.labels.en.value;if(!name){hiddenN++;continue}
      shown.push({name,conv:conv.map(c=>c.mainsnak.datavalue&&c.mainsnak.datavalue.value.id).filter(Boolean)});
      conv.forEach(c=>c.mainsnak.datavalue&&convIds.add(c.mainsnak.datavalue.value.id));
      name.toLowerCase().split(/\s+/).forEach(w=>keep.add(w));
    }
    const convLabels=convIds.size?await wd([...convIds].slice(0,50),'labels'):{};
    const lab=id=>convLabels[id]&&convLabels[id].labels.en?convLabels[id].labels.en.value:'a crime';
    $('pc-people').innerHTML=(shown.length?`<ul>${shown.map(p=>`<li><b>${esc(p.name)}</b>, convicted of ${esc(p.conv.map(lab).join(', '))}</li>`).join('')}</ul>`:'<p>Wikidata records no adult convicted in this case.</p>')
      +`<p class="src">Taken from Wikidata. ${hiddenN?`${hiddenN} other ${hiddenN>1?'people are':'person is'} named there as perpetrator${hiddenN>1?'s':''} but not shown: no conviction is recorded, or they were under 18, which Indian law forbids naming. `:''}A conviction can be overturned on appeal; check the outcome below.</p>`;
  }catch{$('pc-people').innerHTML='<p class="src">Court outcomes could not be loaded right now.</p>'}

  /* outcome: English articles only, trial and outcome sentences, names removed, graphic sentences left out */
  const out=$('pc-outcome');
  if(e.l){out.innerHTML=`<p>This case has no English Wikipedia article, so we cannot check its text for names. Only the facts above are shown.</p>`;return}
  try{
    const sl=(await api('www.wikidata.org',{action:'wbgetentities',ids:e.q,props:'sitelinks',sitefilter:'enwiki'})).entities[e.q];
    const title=sl&&sl.sitelinks&&sl.sitelinks.enwiki&&sl.sitelinks.enwiki.title;if(!title)throw 0;
    const j=await api('en.wikipedia.org',{action:'query',titles:title,prop:'extracts',explaintext:1,exsectionformat:'wiki'});
    const text=(j.query.pages[0]||{}).extract||'';
    const picked=[];let head='';
    for(const line of text.split('\n')){
      const m=/^(={2,6})\s*(.*?)\s*\1$/.exec(line.trim());if(m){head=m[2];continue}
      if(!OUTCOME_HEAD.test(head))continue;
      for(const s of sentences(line))if(OUTCOME_SENT.test(s)&&!GRAPHIC.test(s))picked.push(redact(s.trim(),keep));
    }
    /* up to 20 sentences in article order; a later acquittal or overturned verdict always stays in, so the page never
       leaves a reader with a conviction that no longer stands */
    const uniq=[...new Set(picked)],FINAL=/acquit|overturn|quash|set aside|struck down|exonerat|reversed|commuted|released|pardon|remission|executed|were hanged|was hanged/i;
    const must=new Set(uniq.filter(s=>FINAL.test(s)).slice(-12));let room=20-must.size;
    const list=uniq.filter(s=>must.has(s)||(room>0&&room--));
    out.textContent='';
    if(!list.length){out.innerHTML='<p>The article has no trial or outcome passage we could show safely. Use the link below.</p>';return}
    const ul=document.createElement('ul');list.forEach(s=>{const li=document.createElement('li');li.textContent=s;ul.appendChild(li)});out.appendChild(ul);
    const n=document.createElement('p');n.className='src';
    n.innerHTML='Sentences from the trial and outcome sections of the English Wikipedia article, by its contributors (<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>). Crime Diaries chose only sentences about the investigation, trial and law, left out any that describe the crime, and replaced personal names with “[name withheld]”. Fetched live.';
    out.appendChild(n);
  }catch{out.innerHTML='<p class="src">The outcome could not be loaded right now. Use the link below.</p>'}
};
})();
