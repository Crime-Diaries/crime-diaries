/* Accounts (Supabase) and the legal links. Load after js/config.js and js/chrome.js on every page.
   With no Supabase settings in js/config.js, accounts are off and nothing is loaded.
   The Supabase library (vendor/supabase.js, ~220 KB) loads only on the account page or when a session exists. */
(()=>{
const C=window.CD_CONFIG||{},on=!!(C.SUPABASE_URL&&C.SUPABASE_ANON_KEY);
const page=location.pathname.split('/').pop()||'index.html';
const FREE=['account.html','privacy.html','terms.html','credits.html','about.html']; /* pages a user who has not accepted may still see */

/* nav: an Account link on every page */
const nav=document.querySelector('.nav nav');
if(nav&&!nav.querySelector('a[href="account.html"]')){const a=document.createElement('a');a.href='account.html';a.textContent='Account';
  if(page==='account.html')a.setAttribute('aria-current','page');const about=nav.querySelector('a[href="about.html"]');about?about.after(a):nav.appendChild(a)}

/* footer: legal links on every page */
const foot=document.querySelector('footer .wrap');
if(foot&&!foot.querySelector('.legal-links')){const p=document.createElement('p');p.className='legal-links';
  p.innerHTML='<a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a> · <a href="credits.html">Credits &amp; licences</a> · <a href="about.html#contact">Contact</a>';foot.appendChild(p)}

/* contact details from js/config.js, wherever a page asks for them */
document.querySelectorAll('.cd-email').forEach(a=>{a.textContent=C.CONTACT_EMAIL;a.href='mailto:'+C.CONTACT_EMAIL});
document.querySelectorAll('.cd-operator').forEach(s=>{s.textContent=C.OPERATOR});

let clientP=null;
function client(){
  if(!on)return Promise.resolve(null);
  return clientP||(clientP=new Promise((ok,no)=>{
    const make=()=>ok(window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY,{auth:{persistSession:true,detectSessionInUrl:true,flowType:'pkce'}}));
    if(window.supabase&&window.supabase.createClient)return make();
    const s=document.createElement('script');s.src='vendor/supabase.js';s.onload=make;s.onerror=()=>{clientP=null;no(new Error('could not load the sign-in library'))};document.head.appendChild(s);
  }));
}
/* has this user accepted the current terms and privacy policy? */
async function accepted(sb){
  const {data,error}=await sb.from('consents').select('id').eq('terms_version',C.TERMS_VERSION).eq('privacy_version',C.PRIVACY_VERSION).limit(1);
  if(error)throw error;return data.length>0;
}
const hasSession=()=>{try{return Object.keys(localStorage).some(k=>/^sb-.+-auth-token$/.test(k))}catch{return false}};

/* a signed-in user who has not accepted the current versions sees only the account page (accept, sign out or delete) */
if(on&&hasSession()&&!FREE.includes(page))client().then(async sb=>{
  const {data:{session}}=await sb.auth.getSession();
  if(session&&!(await accepted(sb)))location.replace('account.html?next='+encodeURIComponent(location.pathname.split('/').pop()+location.search));
}).catch(()=>{});

CD.auth={on,client,accepted,config:C};
})();
