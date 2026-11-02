/* The account page: sign in or create an account, accept the terms, download or delete your data. */
(async()=>{
const $=id=>document.getElementById(id),esc=CD.esc,box=$('acct'),A=CD.auth,C=A.config;
const here=location.origin+location.pathname;
/* where to go after accepting: only a page of this site, never another address */
const nextRaw=new URLSearchParams(location.search).get('next')||'';
const next=/^[a-z]+\.html(\?[^\/\\:]*)?$/.test(nextRaw)?nextRaw:'';
const PENDING='cd_pending_consent';
const localKeys=()=>{try{return Object.keys(localStorage).filter(k=>/^cd_/.test(k))}catch{return[]}};

/* works with or without accounts: everything this site keeps in this browser */
const deviceBlock=`<section class="principle" id="device"><h2>Data on this device</h2>
  <p>Without an account, Crime Diaries keeps only your settings (Calm mode, images on or off, sensitive cases on or off, that you read the notice) and any comments or theories you wrote, in this browser only. We never receive them.</p>
  <button class="ghost" id="dev-dl">Download it</button> <button class="ghost danger" id="dev-clear">Delete it from this browser</button> <span id="dev-msg" class="src"></span></section>`;
function wireDevice(){
  $('dev-dl').onclick=()=>download('crime-diaries-this-browser.json',Object.fromEntries(localKeys().map(k=>[k,localStorage.getItem(k)])));
  $('dev-clear').onclick=()=>{if(!confirm('Delete all Crime Diaries settings, comments and theories stored in this browser?'))return;
    localKeys().forEach(k=>localStorage.removeItem(k));$('dev-msg').textContent='Deleted.'};
}
function download(name,obj){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
}
const show=(html,wire)=>{box.innerHTML=html+deviceBlock;wireDevice();wire&&wire()};
const fail=(el,e)=>{el.textContent=(e&&e.message)||String(e)};

if(!A.on){show(`<section class="principle big"><h2>Accounts are not open yet</h2><p>Sign-in is being set up. Everything on Crime Diaries works without an account.</p></section>`);return}

let sb;try{sb=await A.client()}catch(e){show(`<section class="principle"><h2>Sign-in is unavailable</h2><p>${esc(e.message)}. Try again later.</p></section>`);return}

/* the two checkboxes every new account must tick: shown on sign-up and, for Google/GitHub users, on first sign-in */
const consentBoxes=p=>`<label class="chk"><input type="checkbox" id="${p}-age" required> <span>I am 18 or older.</span></label>
  <label class="chk"><input type="checkbox" id="${p}-terms" required> <span>I have read and accept the <a href="terms.html" target="_blank">terms of use</a> and the <a href="privacy.html" target="_blank">privacy policy</a>.</span></label>`;
const bothTicked=p=>$(p+'-age').checked&&$(p+'-terms').checked;
const lockUntilTicked=(p,btns)=>{const f=()=>btns.forEach(b=>{$(b).disabled=!bothTicked(p)});[p+'-age',p+'-terms'].forEach(id=>$(id).onchange=f);f()};
async function recordConsent(){
  const {error}=await sb.from('consents').insert({terms_version:C.TERMS_VERSION,privacy_version:C.PRIVACY_VERSION,age_confirmed:true});
  if(error)throw error;try{localStorage.removeItem(PENDING)}catch{}
}
/* the boxes ticked at sign-up are recorded at first sign-in, and only for that same email address */
const pendingOk=email=>{try{return localStorage.getItem(PENDING)===[C.TERMS_VERSION,C.PRIVACY_VERSION,(email||'').toLowerCase()].join('|')}catch{return false}};
const setPending=email=>{try{localStorage.setItem(PENDING,[C.TERMS_VERSION,C.PRIVACY_VERSION,email.toLowerCase()].join('|'))}catch{}};
const clearPending=()=>{try{localStorage.removeItem(PENDING)}catch{}};

function signedOut(msg){
  show(`${msg?`<p class="notice imported">${esc(msg)}</p>`:''}
  <div class="acct-grid">
  <section class="principle"><h2>Sign in</h2>
    <form id="in-form"><label>Email <input type="email" id="in-email" autocomplete="email" required></label>
    <label>Password <input type="password" id="in-pass" autocomplete="current-password" required></label>
    <button class="ng-go" type="submit">Sign in</button> <button class="ghost" type="button" id="in-forgot">Forgot password?</button></form>
    <p class="src" id="in-msg" role="alert"></p>
    <p class="or">or</p>
    <button class="ghost oauth" id="in-google">Continue with Google</button> <button class="ghost oauth" id="in-github">Continue with GitHub</button>
    <p class="src">New to Crime Diaries through Google or GitHub? You will be asked to confirm your age and accept the terms before you can use your account.</p>
  </section>
  <section class="principle"><h2>Create an account</h2>
    <form id="up-form"><label>Email <input type="email" id="up-email" autocomplete="email" required></label>
    <label>Password (at least 8 characters) <input type="password" id="up-pass" autocomplete="new-password" minlength="8" required></label>
    ${consentBoxes('up')}
    <button class="ng-go" type="submit" id="up-go">Create account</button></form>
    <p class="src" id="up-msg" role="alert"></p>
    <p class="src">We keep your email address, how you sign in, when you accepted our terms, and basic security records. No marketing emails, ever. <a href="privacy.html">Details</a>.</p>
  </section></div>`,()=>{
    lockUntilTicked('up',['up-go']);
    $('in-form').onsubmit=async e=>{e.preventDefault();$('in-msg').textContent='Signing in…';
      const {error}=await sb.auth.signInWithPassword({email:$('in-email').value.trim(),password:$('in-pass').value});
      if(error)return fail($('in-msg'),error);route()};
    $('in-forgot').onclick=async()=>{const email=$('in-email').value.trim();if(!email){$('in-msg').textContent='Type your email above first.';return}
      const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:here});
      $('in-msg').textContent=error?error.message:'If that address has an account, a link to set a new password is on its way.'};
    const oauth=provider=>async()=>{const {error}=await sb.auth.signInWithOAuth({provider,options:{redirectTo:here}});if(error)fail($('in-msg'),error)};
    $('in-google').onclick=oauth('google');$('in-github').onclick=oauth('github');
    $('up-form').onsubmit=async e=>{e.preventDefault();if(!bothTicked('up'))return;$('up-msg').textContent='Creating your account…';
      const email=$('up-email').value.trim();
      const {data,error}=await sb.auth.signUp({email,password:$('up-pass').value,options:{emailRedirectTo:here}});
      if(error){clearPending();return fail($('up-msg'),error)}
      setPending(email); /* recorded on the server at first sign-in, when a session exists */
      if(!data.session){$('up-msg').textContent='Almost done: open the link we just emailed you to confirm your address.';return}
      route()};
  });
}

function needsConsent(user){
  show(`<section class="principle big"><h2>Before you continue</h2>
    <p>You are signed in as <b>${esc(user.email||'')}</b>. To use your account, confirm the following. If our terms or privacy policy changed since you last accepted them, please read them again.</p>
    ${consentBoxes('cg')}
    <p><button class="ng-go" id="cg-go">Accept and continue</button> <button class="ghost" id="cg-out">Sign out</button> <button class="ghost danger" id="cg-del">Delete my account</button></p>
    <p class="src" id="cg-msg" role="alert"></p></section>`,()=>{
    lockUntilTicked('cg',['cg-go']);
    $('cg-go').onclick=async()=>{if(!bothTicked('cg'))return;try{await recordConsent();if(next)location.replace(next);else route()}catch(e){fail($('cg-msg'),e)}};
    $('cg-out').onclick=async()=>{clearPending();await sb.auth.signOut();route()};
    $('cg-del').onclick=()=>deleteAccount($('cg-msg'));
  });
}

async function deleteAccount(msg){
  const typed=prompt('This permanently deletes your account and every record we hold about it. Type DELETE to confirm.');
  if(typed!=='DELETE'){msg.textContent='Not deleted.';return}
  const {error}=await sb.rpc('delete_my_account');if(error)return fail(msg,error);
  await sb.auth.signOut({scope:'local'});signedOut('Your account and its records have been deleted.');
}

async function signedIn(user){
  const {data:cons,error}=await sb.from('consents').select('terms_version,privacy_version,age_confirmed,accepted_at').order('accepted_at');
  const providers=(user.app_metadata&&user.app_metadata.providers)||[];
  show(`<section class="principle big"><h2>Signed in</h2>
    <dl class="acct-dl"><dt>Email</dt><dd>${esc(user.email||'')}</dd><dt>Signs in with</dt><dd>${esc(providers.join(', ')||'email')}</dd>
    <dt>Member since</dt><dd>${esc(new Date(user.created_at).toLocaleDateString())}</dd>
    <dt>Accepted</dt><dd>${error?'could not load':(cons||[]).map(c=>`terms ${esc(c.terms_version)} and privacy ${esc(c.privacy_version)} on ${esc(new Date(c.accepted_at).toLocaleString())}`).join('<br>')}</dd></dl>
    <p class="src">Comments and theories are still saved in this browser only; accounts will carry them in a later update.</p>
    <p><button class="ghost" id="ac-out">Sign out</button></p></section>
  <section class="principle"><h2>Your data</h2>
    <p>Download everything we hold about your account, or delete the account. Deleting removes your account and all its records at once; it cannot be undone.</p>
    <p><button class="ghost" id="ac-dl">Download my data</button> <button class="ghost danger" id="ac-del">Delete my account</button></p>
    <p class="src" id="ac-msg" role="alert"></p></section>`,()=>{
    $('ac-out').onclick=async()=>{clearPending();await sb.auth.signOut();route()};
    $('ac-dl').onclick=()=>download('crime-diaries-account.json',{exported_at:new Date().toISOString(),
      account:{id:user.id,email:user.email,providers,created_at:user.created_at,last_sign_in_at:user.last_sign_in_at,email_confirmed_at:user.email_confirmed_at},
      consents:cons||[],this_browser:Object.fromEntries(localKeys().map(k=>[k,localStorage.getItem(k)]))});
    $('ac-del').onclick=()=>deleteAccount($('ac-msg'));
  });
}

function newPassword(){
  show(`<section class="principle big"><h2>Set a new password</h2><form id="np-form"><label>New password (at least 8 characters) <input type="password" id="np-pass" minlength="8" autocomplete="new-password" required></label>
    <button class="ng-go" type="submit">Save</button></form><p class="src" id="np-msg" role="alert"></p></section>`,()=>{
    $('np-form').onsubmit=async e=>{e.preventDefault();const {error}=await sb.auth.updateUser({password:$('np-pass').value});if(error)return fail($('np-msg'),error);recovering=false;route()};
  });
}

async function route(){
  const {data:{session}}=await sb.auth.getSession();
  if(recovering)return; /* the reset link signed them in: let them set the password first */
  if(!session)return signedOut();
  let ok=false;try{ok=await A.accepted(sb)}catch(e){return show(`<section class="principle"><h2>Something went wrong</h2><p>${esc(e.message)}</p></section>`)}
  if(!ok&&pendingOk(session.user.email)){try{await recordConsent();ok=true}catch{}}
  if(!ok)clearPending();
  if(!ok)return needsConsent(session.user);
  if(next)return location.replace(next);
  signedIn(session.user);
}
let recovering=false;
sb.auth.onAuthStateChange(ev=>{if(ev==='PASSWORD_RECOVERY'){recovering=true;newPassword()}});
const err=new URLSearchParams(location.hash.slice(1)).get('error_description')||new URLSearchParams(location.search).get('error_description');
if(err)signedOut(err);else route();
})();
