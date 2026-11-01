/* Forensics Lab: three hands-on stations (cipher room, print comparison, DNA lab).
   Every sample is generated in the browser; no real person's data is used.
   Respects calm mode (html.calm and the cd:calm event) and prefers-reduced-motion. */
(()=>{
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!$('c-chart'))return;

/* ---------- calm mode ---------- */
const root=document.documentElement,RM=matchMedia('(prefers-reduced-motion: reduce)');
let calmFlag=null;
const isCalm=()=>RM.matches||(calmFlag!==null?calmFlag:root.classList.contains('calm'));
const calmHooks=[];
document.addEventListener('cd:calm',e=>{calmFlag=!!(e&&e.detail);calmHooks.forEach(f=>f())});
if(RM.addEventListener)RM.addEventListener('change',()=>calmHooks.forEach(f=>f()));

/* ---------- shared helpers ---------- */
const cs=getComputedStyle(root),tok=(n,d)=>cs.getPropertyValue(n).trim()||d;
const COL={ink:tok('--ink','#e8d8d4'),muted:tok('--muted','#a3918d'),red:tok('--red','#d4101f'),red2:tok('--red2','#ff3b3b'),
  green:tok('--green','#34d399'),tape:tok('--tape','#f2c400'),bg:tok('--bg','#060405'),mono:tok('--mono','monospace')};
/* seeded random numbers (mulberry32), so a sample number always regenerates the same sample */
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const newSeed=()=>1+Math.floor(Math.random()*99999);
/* size a canvas to its CSS box at the device pixel ratio; returns a context in CSS pixels */
function fit(cv){
  const r=cv.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height),d=Math.min(window.devicePixelRatio||1,2);
  const W=Math.round(w*d),H=Math.round(h*d);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
  const x=cv.getContext('2d');x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,w,h);return {x,w,h};
}
const LETTERS='ABCD';

/* =================== STATION 1: cipher room =================== */
const QUOTES=[
  ['It is a capital mistake to theorize before one has data. Insensibly one begins to twist facts to suit theories, instead of theories to suit facts.','Arthur Conan Doyle, A Scandal in Bohemia (1891)'],
  ['When you have eliminated the impossible, whatever remains, however improbable, must be the truth.','Arthur Conan Doyle, The Sign of the Four (1890)'],
  ['You see, but you do not observe. The distinction is clear.','Arthur Conan Doyle, A Scandal in Bohemia (1891)'],
  ['There is nothing more deceptive than an obvious fact.','Arthur Conan Doyle, The Boscombe Valley Mystery (1891)'],
  ['The world is full of obvious things which nobody by any chance ever observes.','Arthur Conan Doyle, The Hound of the Baskervilles (1902)'],
  ['It has long been an axiom of mine that the little things are infinitely the most important.','Arthur Conan Doyle, A Case of Identity (1891)'],
  ['Data! Data! Data! I can\'t make bricks without clay.','Arthur Conan Doyle, The Adventure of the Copper Beeches (1892)']
];
/* typical English letter frequencies, % */
const EN=[8.2,1.5,2.8,4.3,12.7,2.2,2.0,6.1,7.0,.15,.77,4.0,2.4,6.7,7.5,1.9,.095,6.0,6.3,9.1,2.8,.98,2.4,.15,2.0,.074];
const AZ='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const shift=(s,k)=>s.replace(/[A-Z]/g,ch=>AZ[(AZ.indexOf(ch)+k+260)%26]);
const counts=s=>{const n=new Array(26).fill(0);for(const ch of s){const i=AZ.indexOf(ch);if(i>=0)n[i]++}return n};
const C={qi:-1,key:0,text:'',steps:0,solved:false};
const slider=$('c-shift');

function cNew(){
  let i;do i=Math.floor(Math.random()*QUOTES.length);while(i===C.qi&&QUOTES.length>1);
  C.qi=i;C.key=3+Math.floor(Math.random()*21);C.text=shift(QUOTES[i][0].toUpperCase(),C.key);C.steps=0;C.solved=false;
  slider.value=0;$('c-text').textContent=C.text;
  const r=$('c-result');r.classList.remove('good');
  r.textContent='Slide to shift every letter back along the alphabet. Watch the red bars: when their shape lines up with the grey bars for typical English, you have found the key.';
  cUpdate(false);
}
function cUpdate(moved){
  const v=+slider.value,plain=shift(C.text,-v);
  if(moved&&!C.solved)C.steps++;
  $('c-shiftv').textContent=v;$('c-plain').textContent=plain;
  const ok=v===C.key;$('c-plain').classList.toggle('ok',ok);
  if(ok&&!C.solved){
    C.solved=true;const q=QUOTES[C.qi],r=$('c-result');
    r.classList.add('good');
    r.innerHTML=`<b>Solved in ${C.steps} step${C.steps===1?'':'s'}.</b> The key was a shift of ${C.key}: every letter had been moved ${C.key} places along the alphabet. <cite>${esc(q[1])}</cite>`;
  }
  cDraw();
}
function cDraw(){
  const cv=$('c-chart'),{x,w,h}=fit(cv),v=+slider.value,plain=shift(C.text,-v),n=counts(plain),tot=n.reduce((a,b)=>a+b,0)||1;
  const pct=n.map(c=>c*100/tot),max=Math.max(13,...pct),pad=4,cw=(w-pad*2)/26,mid=h/2,area=mid-20,bw=Math.max(2,cw*.66);
  const ok=v===C.key;
  x.font=`10px ${COL.mono}`;x.textBaseline='top';x.textAlign='left';
  x.fillStyle=COL.muted;x.fillText(`THIS MESSAGE · SHIFT ${v}`,pad,0);
  x.textBaseline='bottom';x.fillText('TYPICAL ENGLISH',pad,h);
  for(let i=0;i<26;i++){
    const cx=pad+cw*i+cw/2;
    const t=pct[i]/max*area;x.fillStyle=ok?COL.green:COL.red2;x.globalAlpha=.9;x.fillRect(cx-bw/2,mid-7-t,bw,t);
    const e=EN[i]/max*area;x.fillStyle=COL.ink;x.globalAlpha=.28;x.fillRect(cx-bw/2,mid+7,bw,e);
    x.globalAlpha=1;x.fillStyle=COL.ink;x.textAlign='center';x.textBaseline='middle';x.fillText(AZ[i],cx,mid);
  }
  const top=AZ[n.indexOf(Math.max(...n))];
  cv.setAttribute('aria-label',`Letter frequency chart at shift ${v}. Most common letter in your decoding: ${top}. In typical English the most common letter is E.`);
}
slider.addEventListener('input',()=>cUpdate(true));
$('c-prev').onclick=()=>{slider.value=(+slider.value+25)%26;cUpdate(true)};
$('c-next').onclick=()=>{slider.value=(+slider.value+1)%26;cUpdate(true)};
$('c-new').onclick=cNew;
$('c-hint').onclick=()=>{
  const n=counts(C.text),top=AZ[n.indexOf(Math.max(...n))],r=$('c-result');
  r.classList.remove('good');
  r.innerHTML=`<b>Hint:</b> the most common letter in English is usually E. In the intercepted message the most common letter is <b>${top}</b>. Which shift turns ${top} back into E? (In a short message the most common letter is not always E.)`;
};

/* =================== STATION 2: print comparison =================== */
/* A print is drawn as level lines (contours) of a smooth field, so ridge spacing stays even.
   Minutiae are made by cutting a gap in a ridge (two ridge endings) or adding a short fork. */
const S=.07,GRID=150;
const TAB={1:[[3,2]],2:[[2,1]],3:[[3,1]],4:[[0,1]],5:[[0,1],[3,2]],6:[[0,2]],7:[[0,3]],8:[[0,3]],9:[[0,2]],10:[[0,3],[2,1]],11:[[0,1]],12:[[3,1]],13:[[2,1]],14:[[3,2]]};
const dseg=(px,py,ax,ay,bx,by)=>{const vx=bx-ax,vy=by-ay,t=Math.max(0,Math.min(1,((px-ax)*vx+(py-ay)*vy)/(vx*vx+vy*vy)));return Math.hypot(px-ax-t*vx,py-ay-t*vy)};
const inOval=(x,y)=>(x/.8)**2+((y-.03)/.97)**2<1;

function makePrint(seed,kind){
  const r=rng(seed);
  kind=kind||['whorl','loop','arch'][r()*3|0];
  const cx=(r()-.5)*.3,cy=(r()-.5)*.3,rot=(r()-.5)*.7,dir=r()<.5?-1:1,el=.72+r()*.25,off=r()*S;
  const W=[0,1,2].map(()=>({a:S*(.12+r()*.16),fx:2+r()*4,fy:2+r()*4,p:r()*6.283,q:r()*6.283}));
  let path=null;
  if(kind==='loop'){path=[[0,0]];let a=.3+r()*.2,px=0,py=0;for(let i=0;i<8;i++){a+=.15+r()*.06;px+=Math.cos(a)*.3*dir;py+=Math.sin(a)*.3;path.push([px,py])}}
  const co=Math.cos(rot),si=Math.sin(rot);
  function F(x,y){
    const dx=x-cx,dy=y-cy,u=dx*co+dy*si,v=-dx*si+dy*co;let f;
    if(kind==='whorl')f=Math.hypot(u*1.08,v*el);
    else if(kind==='arch')f=v+.42*Math.exp(-u*u/.2)+.1*u*dir;
    else{f=1e9;for(let i=1;i<path.length;i++)f=Math.min(f,dseg(u,v,path[i-1][0],path[i-1][1],path[i][0],path[i][1]))}
    for(const w of W)f+=w.a*Math.sin(w.fx*x+w.p)*Math.sin(w.fy*y+w.q);
    return f;
  }
  /* marching squares over [-1,1]² */
  const n1=GRID+1,h=2/GRID,V=new Float32Array(n1*n1),segs=[];
  for(let j=0;j<n1;j++)for(let i=0;i<n1;i++)V[j*n1+i]=F(-1+i*h,-1+j*h);
  for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++){
    const x0=-1+i*h,y0=-1+j*h;if(!inOval(x0+h/2,y0+h/2))continue;
    const a=V[j*n1+i],b=V[j*n1+i+1],c=V[(j+1)*n1+i+1],d=V[(j+1)*n1+i];
    const lo=Math.min(a,b,c,d),hi=Math.max(a,b,c,d);
    for(let k=Math.ceil((lo-off)/S);off+k*S<=hi;k++){
      const L=off+k*S,t=TAB[(a>L?8:0)|(b>L?4:0)|(c>L?2:0)|(d>L?1:0)];if(!t)continue;
      const E=e=>e===0?[x0+h*(L-a)/(b-a),y0]:e===1?[x0+h,y0+h*(L-b)/(c-b)]:e===2?[x0+h*(L-d)/(c-d),y0+h]:[x0,y0+h*(L-a)/(d-a)];
      for(const [e1,e2] of t){const p=E(e1),q=E(e2);segs.push({x1:p[0],y1:p[1],x2:q[0],y2:q[1],mx:(p[0]+q[0])/2,my:(p[1]+q[1])/2,k,on:true})}
    }
  }
  /* minutiae */
  const M=[],branches=[],ep=.004;
  const grad=(x,y)=>{const gx=(F(x+ep,y)-F(x-ep,y))/(2*ep),gy=(F(x,y+ep)-F(x,y-ep))/(2*ep),g=Math.hypot(gx,gy)||1;return [gx/g,gy/g,g]};
  const free=(x,y,d)=>M.every(m=>Math.hypot(m.x-x,m.y-y)>=d);
  for(let tries=0;M.length<11&&tries<300;tries++){
    const x=(r()*2-1)*.6,y=(r()*2-1)*.74;
    if((x/.6)**2+(y/.74)**2>1||!free(x,y,.22))continue;
    let best=null,bd=1e9;for(const s of segs){if(!s.on)continue;const dd=(s.mx-x)**2+(s.my-y)**2;if(dd<bd){bd=dd;best=s}}
    if(!best||bd>.0025)continue;
    let tx=best.x2-best.x1,ty=best.y2-best.y1;const tl=Math.hypot(tx,ty)||1;tx/=tl;ty/=tl;
    if(r()<.5){tx=-tx;ty=-ty}
    const px=best.mx,py=best.my;
    if(r()<.6){
      /* ridge ending: cut a gap ahead of P; both cut ends are endings */
      const R=.075,qx=px+tx*R,qy=py+ty*R,ex=px+tx*2*R,ey=py+ty*2*R;
      if(!inOval(ex*1.15,ey*1.1)||!free(ex,ey,.15))continue;
      for(const s of segs)if(s.on&&s.k===best.k&&Math.hypot(s.mx-qx,s.my-qy)<R)s.on=false;
      M.push({x:px,y:py,type:'ending',a:Math.atan2(-ty,-tx)});
      M.push({x:ex,y:ey,type:'ending',a:Math.atan2(ty,tx)});
    }else{
      /* fork: a short branch from this ridge into the next one */
      const [nx,ny]=grad(px,py),Lb=.08,target=off+(best.k+1)*S;
      let qx=px+tx*Lb+nx*S,qy=py+ty*Lb+ny*S;
      const [mx,my,g]=grad(qx,qy),dv=(target-F(qx,qy))/g;qx+=mx*dv;qy+=my*dv;
      if(!inOval(qx*1.15,qy*1.1))continue;
      branches.push({x1:px,y1:py,cx:px+tx*Lb*.5+nx*S*.15,cy:py+ty*Lb*.5+ny*S*.15,x2:qx,y2:qy});
      M.push({x:px,y:py,type:'fork',a:Math.atan2(ty,tx)});
    }
  }
  return {kind,segs,branches,M};
}
function drawRidges(x,P,map,scale,o={}){
  x.lineCap='round';x.lineJoin='round';x.lineWidth=Math.max(1,S*scale*(o.width||.46));x.strokeStyle=o.color||COL.ink;x.globalAlpha=o.alpha||.82;
  x.beginPath();
  P.segs.forEach((s,i)=>{if(!s.on||(o.skip&&o.skip(s,i)))return;const a=map(s.x1,s.y1),b=map(s.x2,s.y2);x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1])});
  for(const b of P.branches){const p=map(b.x1,b.y1),c=map(b.cx,b.cy),q=map(b.x2,b.y2);x.moveTo(p[0],p[1]);x.quadraticCurveTo(c[0],c[1],q[0],q[1])}
  x.stroke();x.globalAlpha=1;
}
function drawMinutiae(x,list,map,scale,colour){
  const rad=Math.max(3,S*scale*.85);x.lineWidth=1.5;x.globalAlpha=1;
  for(const m of list){
    const [X,Y]=map(m.x,m.y),[X2,Y2]=map(m.x+Math.cos(m.a)*S*1.4,m.y+Math.sin(m.a)*S*1.4);
    x.strokeStyle=colour?colour(m):COL.red2;x.beginPath();
    if(m.type==='ending')x.arc(X,Y,rad,0,Math.PI*2);else x.rect(X-rad,Y-rad,rad*2,rad*2);
    x.moveTo(X,Y);x.lineTo(X2,Y2);x.stroke();
  }
}
const FP={seed:0,prints:[],match:0,C:null,R:.46,rho:0,inside:[],picked:new Set(),hits:{},done:false,noise:null};
const refs=$('fp-refs');
refs.innerHTML=LETTERS.split('').map((l,i)=>`<button class="fp-card" data-i="${i}" aria-pressed="false" aria-label="Reference ${l}"><canvas aria-hidden="true"></canvas><span>REFERENCE ${l}</span></button>`).join('');
const cards=[...refs.querySelectorAll('.fp-card')];

function fpNew(seed){
  FP.seed=seed;const r=rng(seed),kind=['whorl','loop','arch'][r()*3|0];
  const match=makePrint(seed*7+1,kind),others=[makePrint(seed*7+2,kind),makePrint(seed*7+3),makePrint(seed*7+4)];
  FP.match=r()*4|0;others.splice(FP.match,0,match);FP.prints=others;
  let best=null;
  for(let t=0;t<80;t++){
    const C={x:(r()*2-1)*.3,y:(r()*2-1)*.36},ins=match.M.filter(m=>Math.hypot(m.x-C.x,m.y-C.y)<FP.R*.85);
    if(!best||ins.length>best.ins.length)best={C,ins};if(ins.length>=6)break;
  }
  FP.C=best.C;FP.inside=best.ins;FP.rho=(r()<.5?-1:1)*(.18+r()*.3);
  FP.noise={p:[r()*6.3,r()*6.3,r()*6.3],blob:[r()*6.3,r()*6.3],seed:seed*13+5};
  FP.picked=new Set();FP.hits={};FP.done=false;
  cards.forEach(c=>{c.classList.remove('right','wrong');c.setAttribute('aria-pressed','false')});
  $('fp-seed').textContent=`SAMPLE ${seed}`;
  const res=$('fp-result');res.classList.remove('good');
  res.textContent=`The latent print is partial, turned and smudged. It came from one of the four references on file, and ${FP.inside.length} minutiae are visible in it. Pick the reference it matches.`;
  fpDraw();
}
function fpDraw(){
  const show=$('fp-min').checked;
  /* latent */
  {const {x,w,h}=fit($('fp-latent')),P=FP.prints[FP.match],sc=w/(2*FP.R*1.08),cr=Math.cos(FP.rho),sr=Math.sin(FP.rho),C=FP.C;
    const map=(px,py)=>{const dx=px-C.x,dy=py-C.y;return [w/2+(dx*cr-dy*sr)*sc,h/2+(dx*sr+dy*cr)*sc]};
    const r=rng(FP.noise.seed),N=FP.noise;
    x.fillStyle='#0d0a0b';x.fillRect(0,0,w,h);
    for(let i=0;i<260;i++){x.fillStyle=`rgba(232,216,212,${(r()*.07).toFixed(3)})`;x.fillRect(r()*w,r()*h,1+r()*2,1+r()*2)}
    x.save();x.beginPath();
    for(let i=0;i<=64;i++){const t=i/64*Math.PI*2,rad=w*.44*(1+.09*Math.sin(3*t+N.blob[0])+.05*Math.sin(5*t+N.blob[1]));const X=w/2+Math.cos(t)*rad,Y=h/2+Math.sin(t)*rad*.92;i?x.lineTo(X,Y):x.moveTo(X,Y)}
    x.closePath();x.clip();
    const drop=new Uint8Array(P.segs.length);for(let i=0;i<drop.length;i++)drop[i]=r()<.08?1:0;
    drawRidges(x,P,map,sc,{color:'#d6c8c3',alpha:.78,width:.52,skip:(s,i)=>drop[i]||Math.sin(9*s.mx+N.p[0])*Math.sin(8*s.my+N.p[1])+.6*Math.sin(13*s.mx+5*s.my+N.p[2])>1.05});
    if(show)drawMinutiae(x,FP.inside,map,sc,()=>COL.tape);
    x.restore();
    /* evidence scale */
    x.strokeStyle=COL.tape;x.globalAlpha=.7;x.lineWidth=1;x.beginPath();x.moveTo(10,h-10);x.lineTo(10+w*.25,h-10);
    for(let i=0;i<=5;i++){const X=10+i*w*.05;x.moveTo(X,h-10);x.lineTo(X,h-(i%5?14:18))}x.stroke();x.globalAlpha=1;
  }
  /* references */
  cards.forEach((card,i)=>{
    const {x,w,h}=fit(card.querySelector('canvas')),P=FP.prints[i],sc=w/2.1,map=(px,py)=>[w/2+px*sc,h/2+py*sc];
    drawRidges(x,P,map,sc,{alpha:.78});
    if(show){
      const hit=FP.hits[i]||(FP.done&&i===FP.match?FP.inside:null);
      drawMinutiae(x,P.M,map,sc,m=>hit&&hit.includes(m)?COL.green:COL.red2);
    }
    if(FP.done&&i===FP.match){const [X,Y]=map(FP.C.x,FP.C.y);x.setLineDash([4,4]);x.strokeStyle=COL.green;x.lineWidth=1.5;x.beginPath();x.arc(X,Y,FP.R*sc*.95,0,Math.PI*2);x.stroke();x.setLineDash([])}
  });
}
function fpPick(i){
  if(FP.done||FP.picked.has(i))return;
  const L=LETTERS[i],card=cards[i],res=$('fp-result'),n=FP.inside.length;
  cards.forEach(c=>c.setAttribute('aria-pressed','false'));card.setAttribute('aria-pressed','true');
  if(i===FP.match){
    FP.done=true;card.classList.add('right');
    cards.forEach((c,j)=>{if(j!==i)c.classList.add('wrong')});
    const ex=FP.picked.size;res.classList.add('good');
    res.innerHTML=`<b>Reference ${L} matches.</b> All ${n} minutiae in the latent sit in the same place, with the same type and direction, in this print${ex?`, after ${ex} exclusion${ex>1?'s':''}`:''}. The dashed circle shows where the latent came from. Turn on “Show minutiae” to compare the points. In real casework a second examiner would check this independently.`;
  }else{
    const P=FP.prints[i],C=FP.C;
    const hit=P.M.filter(m=>Math.hypot(m.x-C.x,m.y-C.y)<FP.R&&FP.inside.some(l=>l.type===m.type&&Math.hypot(l.x-m.x,l.y-m.y)<.12));
    FP.hits[i]=hit;FP.picked.add(i);card.classList.add('wrong');res.classList.remove('good');
    const c=Math.min(hit.length,n);
    res.innerHTML=`<b>Reference ${L} is excluded.</b> Only ${c} of ${n} minutiae line up, and the ridge flow does not agree. The latent is turned and partial, so follow the ridge flow first, then check the points.`;
  }
  fpDraw();
}
refs.addEventListener('click',e=>{const b=e.target.closest('.fp-card');if(b)fpPick(+b.dataset.i)});
$('fp-min').addEventListener('change',fpDraw);
$('fp-new').onclick=()=>fpNew(newSeed());

/* =================== STATION 3: DNA lab =================== */
/* Real STR locus names; allele frequencies are illustrative (weights in %), not from a real population database. */
const LOCI=[
  {n:'D8S1179',lo:7.5,hi:18.5,f:{10:6,11:7,12:14,13:31,14:20,15:12,16:4,17:2}},
  {n:'D21S11',lo:26.5,hi:35,f:{27:3,28:16,29:20,30:25,'30.2':3,31:7,'31.2':9,32:2,'32.2':11,'33.2':5}},
  {n:'TH01',lo:4.5,hi:10.5,f:{6:23,7:18,8:11,9:15,'9.3':30,10:2}},
  {n:'FGA',lo:17.5,hi:27.5,f:{19:6,20:13,21:18,22:21,'22.2':1,23:15,24:13,25:8,26:3}}
];
LOCI.forEach(L=>{L.keys=Object.keys(L.f);L.tot=L.keys.reduce((a,k)=>a+L.f[k],0)});
/* "30.2" = 30 repeats plus 2 bases of a 4-base repeat */
const pos=a=>{const [i,d]=String(a).split('.');return +i+(d?+d/4:0)};
const pickAllele=(r,L)=>{let t=r()*L.tot;for(const k of L.keys){t-=L.f[k];if(t<=0)return k}return L.keys[L.keys.length-1]};
const sortG=g=>g.sort((a,b)=>pos(a)-pos(b));
const genotype=r=>LOCI.map(L=>sortG([pickAllele(r,L),pickAllele(r,L)]));
const sharedAt=(g1,g2)=>{const b=[...g2];let n=0;for(const a of g1){const i=b.indexOf(a);if(i>=0){n++;b.splice(i,1)}}return n};
const shared=(p,q)=>p.reduce((s,g,i)=>s+sharedAt(g,q[i]),0);
const describe=g=>g.map((a,i)=>`${LOCI[i].n} ${a[0]}, ${a[1]}`).join('; ');
const DNA={scene:null,lanes:[],sel:-1,done:false,out:new Set(),anim:1,raf:0};
$('dna-loci').innerHTML=LOCI.map(L=>`<span>${esc(L.n)}</span>`).join('');
const laneBox=$('dna-lanes');

function relative(r,scene){
  /* shares one allele at most loci, like a close relative would; never the full profile */
  for(let t=0;t<60;t++){
    const g=scene.map((sg,i)=>sortG([sg[r()*2|0],pickAllele(r,LOCI[i])]));
    const z=r()*4|0;for(let u=0;u<30&&sharedAt(g[z],scene[z]);u++)g[z]=sortG([pickAllele(r,LOCI[z]),pickAllele(r,LOCI[z])]);
    const s=shared(g,scene);if(s>=4&&s<=6)return g;
  }
  return genotype(r);
}
function dnaNew(seed){
  const r=rng(seed),scene=genotype(r),lanes=[{g:scene.map(a=>[...a])},{g:relative(r,scene)}];
  while(lanes.length<4){const g=genotype(r);if(shared(g,scene)<=4)lanes.push({g})}
  for(let i=lanes.length-1;i>0;i--){const j=r()*(i+1)|0;[lanes[i],lanes[j]]=[lanes[j],lanes[i]]}
  lanes.forEach((l,i)=>{l.k=shared(l.g,scene);l.L=LETTERS[i]});
  Object.assign(DNA,{scene,lanes,sel:-1,done:false,out:new Set()});
  laneBox.innerHTML=lanes.map((l,i)=>`<button class="dna-lane" data-i="${i}" aria-pressed="false" aria-label="Reference ${l.L}: ${esc(describe(l.g))}. Select to compare with the scene sample."><div class="dna-name"><span>REFERENCE ${l.L}</span><em></em></div><canvas aria-hidden="true"></canvas></button>`).join('');
  $('dna-scene').setAttribute('aria-label',`Scene sample profile: ${describe(scene)}`);
  $('dna-call').disabled=true;$('dna-explain').hidden=true;
  const res=$('dna-result');res.classList.remove('good');
  res.textContent='Each peak is one allele; the number under it is its repeat count. Select a reference to compare it with the scene sample, then call it.';
  dnaAnimate();
}
function drawEPG(cv,g,other,dim){
  const {x,w,h}=fit(cv),pw=w/4,base=h-14,top=4,H=base-top,sg=Math.max(2,pw*.022);
  x.font=`10px ${COL.mono}`;x.textBaseline='top';x.textAlign='center';
  LOCI.forEach((L,i)=>{
    const x0=i*pw;
    if(i){x.strokeStyle='rgba(232,216,212,.1)';x.lineWidth=1;x.beginPath();x.moveTo(x0+.5,top);x.lineTo(x0+.5,base);x.stroke()}
    x.strokeStyle='rgba(232,216,212,.28)';x.lineWidth=1;x.beginPath();
    for(let k=0;k<=40;k++){const X=x0+4+k*(pw-8)/40,Y=base-.5-Math.abs(Math.sin(k*1.7+i*3+g[i][0].length))*1.4;k?x.lineTo(X,Y):x.moveTo(X,Y)}x.stroke();
    const al=g[i],hom=al[0]===al[1],uniq=hom?[al[0]]:al;
    const px=uniq.map(a=>x0+6+(pos(a)-L.lo)/(L.hi-L.lo)*(pw-12));
    const lx=[...px];if(lx.length===2&&lx[1]-lx[0]<26){const m=(lx[0]+lx[1])/2;lx[0]=m-13;lx[1]=m+13}
    uniq.forEach((a,j)=>{
      const ph=H*(hom?.95:.58+(Math.round(pos(a)*4)%3)*.1)*DNA.anim;
      const ok=other?other[i].includes(a):null,col=ok===null?COL.ink:ok?COL.green:COL.red2;
      x.globalAlpha=dim?.35:.85;x.fillStyle=col;x.beginPath();x.moveTo(px[j]-4*sg,base);
      for(let t=-4;t<=4;t+=.25)x.lineTo(px[j]+t*sg,base-ph*Math.exp(-t*t/2));
      x.closePath();x.fill();x.globalAlpha=1;
      x.fillStyle=dim?COL.muted:col;x.fillText(a,Math.max(x0+12,Math.min(x0+pw-12,lx[j])),base+2);
    });
  });
}
function dnaDraw(){
  const sel=DNA.sel>=0?DNA.lanes[DNA.sel]:null;
  drawEPG($('dna-scene'),DNA.scene,sel?sel.g:null,false);
  laneBox.querySelectorAll('.dna-lane').forEach((b,i)=>{
    const l=DNA.lanes[i],on=i===DNA.sel;
    drawEPG(b.querySelector('canvas'),l.g,on?DNA.scene:null,sel&&!on);
  });
}
function dnaAnimate(){
  cancelAnimationFrame(DNA.raf);DNA.raf=0;
  if(isCalm()){DNA.anim=1;dnaDraw();return}
  const t0=performance.now();
  const step=t=>{const p=Math.min(1,(t-t0)/700);DNA.anim=1-Math.pow(1-p,3);dnaDraw();DNA.raf=p<1?requestAnimationFrame(step):0};
  DNA.anim=0;DNA.raf=requestAnimationFrame(step);
}
function dnaSelect(i){
  DNA.sel=i;const l=DNA.lanes[i];
  laneBox.querySelectorAll('.dna-lane').forEach((b,j)=>{b.setAttribute('aria-pressed',j===i);if(j===i)b.querySelector('em').textContent=`${l.k}/8 ALLELES`});
  if(!DNA.done){
    $('dna-call').disabled=DNA.out.has(i);
    const res=$('dna-result');res.classList.remove('good');
    res.innerHTML=`Comparing <b>Reference ${l.L}</b> with the scene sample: <b>${l.k} of 8 alleles match</b>. `+
      LOCI.map((L,k)=>`${esc(L.n)} ${sharedAt(l.g[k],DNA.scene[k])}/2`).join(' · ')+(DNA.out.has(i)?'. Already excluded.':'. Green peaks match, red peaks do not.');
  }
  dnaDraw();
}
function rmpText(){
  let p=1;DNA.scene.forEach((g,i)=>{const L=LOCI[i],a=L.f[g[0]]/L.tot,b=L.f[g[1]]/L.tot;p*=g[0]===g[1]?a*a:2*a*b});
  const n=1/p,m=Math.pow(10,Math.max(0,Math.floor(Math.log10(n))-1));
  return Math.max(1,Math.round(n/m)*m).toLocaleString('en');
}
$('dna-call').onclick=()=>{
  if(DNA.sel<0||DNA.done)return;
  const l=DNA.lanes[DNA.sel],res=$('dna-result'),btn=laneBox.querySelectorAll('.dna-lane')[DNA.sel];
  if(l.k===8){
    DNA.done=true;btn.classList.add('right');$('dna-call').disabled=true;res.classList.add('good');
    res.innerHTML=`<b>Reference ${l.L} matches the scene sample at all 8 alleles.</b> The reference cannot be excluded as the source.`;
    const rel=DNA.lanes.find(x=>x.k>=4&&x.k<8);
    const ex=$('dna-explain');ex.hidden=false;
    ex.innerHTML=`<h3>How strong is a match?</h3>
      <p>The <b>random match probability</b> asks how often an unrelated person, picked at random, would have this same profile by chance. With these 4 loci and illustrative allele frequencies it is about <b>1 in ${rmpText()}</b>.</p>
      <p>Real labs test 20 or more loci, which usually takes the figure to 1 in billions or more. Even then it answers only one question: whose DNA this could be.</p>`+
      (rel?`<p>Reference ${rel.L} shared ${rel.k} of 8 alleles, the kind of overlap close relatives often have. A partial match is never treated as a match.</p>`:'');
  }else{
    DNA.out.add(DNA.sel);btn.classList.add('out');$('dna-call').disabled=true;res.classList.remove('good');
    res.innerHTML=`<b>Reference ${l.L} is excluded.</b> It shares ${l.k} of 8 alleles. A clear mismatch at even one locus excludes a reference sample, so this is an exclusion, not a match. Try another reference.`;
  }
};
laneBox.addEventListener('click',e=>{const b=e.target.closest('.dna-lane');if(b)dnaSelect(+b.dataset.i)});
$('dna-new').onclick=()=>dnaNew(newSeed());

/* ---------- start, resize, calm ---------- */
cNew();fpNew(newSeed());dnaNew(newSeed());
const redraw=()=>{cDraw();fpDraw();dnaDraw()};
let rt=0;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(redraw,120)});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(redraw);
calmHooks.push(()=>{if(isCalm()&&DNA.raf){cancelAnimationFrame(DNA.raf);DNA.raf=0;DNA.anim=1;dnaDraw()}});
})();
