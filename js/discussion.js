/* Discussion on the case page: a Comments tab and a separate Theories tab, backed by Posts. */
(()=>{
const box=document.getElementById('discussion');if(!box)return;
const caseId=new URLSearchParams(location.search).get('id');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const when=t=>{const s=(Date.now()-t)/1000;return s<60?'just now':s<3600?`${s/60|0} min ago`:s<86400?`${s/3600|0} h ago`:new Date(t).toLocaleDateString()};
const TXT={
  comment:{intro:'Talk about the case: questions, corrections, what you read. Please cite a source for any claim of fact.',ph:'Add a comment…',btn:'POST COMMENT',none:'No comments yet. Start the discussion.'},
  theory:{intro:'Theories are speculation, not fact, and are labelled that way. Never name a living person as guilty unless a court has convicted them.',ph:'Share your theory…',btn:'POST THEORY',none:'No theories yet.'}
};
let kind='comment';

box.innerHTML=`<h2>Discussion</h2>
  <div class="tabs" role="tablist"><button role="tab" data-k="comment">Comments <span></span></button><button role="tab" data-k="theory">Theories <span></span></button></div>
  <p class="d-intro" id="d-intro"></p>
  <form class="d-form" id="d-form">
    <input id="d-name" maxlength="40" placeholder="Your name (optional)" autocomplete="nickname">
    <textarea id="d-text" rows="4" maxlength="2000" required></textarea>
    <label class="d-ok" id="d-ok"><input type="checkbox" id="d-check"> This is my opinion, and I'm not calling an unconvicted person guilty.</label>
    <div class="d-row"><span class="d-err" id="d-err" role="alert"></span><button class="d-send" id="d-send"></button></div>
  </form>
  <ol class="posts" id="d-list"></ol>
  <p class="d-local">Prototype: posts are saved in this browser only, until the database is connected.</p>`;
const $=id=>document.getElementById(id);
try{$('d-name').value=localStorage.getItem('cd_name')||''}catch{}

async function render(){
  const n=await Posts.counts(caseId);
  box.querySelectorAll('.tabs button').forEach(b=>{b.setAttribute('aria-selected',b.dataset.k===kind);b.querySelector('span').textContent=n[b.dataset.k]||''});
  const t=TXT[kind];$('d-intro').textContent=t.intro;$('d-text').placeholder=t.ph;$('d-send').textContent=t.btn;
  $('d-ok').hidden=kind!=='theory';box.classList.toggle('is-theory',kind==='theory');
  const list=await Posts.list(caseId,kind);
  $('d-list').innerHTML=list.length?list.map(p=>`<li class="post" data-id="${p.id}">
      <div class="p-head">${kind==='theory'?'<span class="tag">THEORY · NOT FACT</span>':''}<b>${esc(p.name)}</b><time>${when(p.at)}</time></div>
      <p>${esc(p.text).replace(/\n/g,'<br>')}</p>
      <div class="p-act"><button class="vote${p.voted?' on':''}" aria-pressed="${p.voted}">▲ ${p.votes}</button><button class="rep">Report</button></div></li>`).join('')
    :`<li class="none">${t.none}</li>`;
}
box.querySelector('.tabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;kind=b.dataset.k;$('d-err').textContent='';render()};
$('d-form').onsubmit=async e=>{
  e.preventDefault();$('d-err').textContent='';
  if(kind==='theory'&&!$('d-check').checked){$('d-err').textContent='Tick the box to confirm before posting a theory.';return}
  try{
    const name=$('d-name').value;await Posts.add(caseId,kind,{name,text:$('d-text').value});
    try{localStorage.setItem('cd_name',name)}catch{}
    $('d-text').value='';$('d-check').checked=false;render();
  }catch(err){$('d-err').textContent=err.message}
};
$('d-list').onclick=async e=>{
  const li=e.target.closest('.post');if(!li)return;
  if(e.target.closest('.vote')){await Posts.vote(caseId,li.dataset.id);render()}
  else if(e.target.closest('.rep')&&confirm('Report this post? It will be hidden for review.')){await Posts.report(caseId,li.dataset.id);render()}
};
render();
})();
