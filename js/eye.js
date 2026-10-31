/* THE EYE: the opener's procedural eye (skin, lids, sclera, fibrous iris, pupil),
   rendered as ASCII and steered by the pointer. createEye() can run several at once. */
(()=>{
const sm=t=>t*t*(3-2*t),cl=(x,a=0,b=1)=>x<a?a:x>b?b:x,mix=(a,b,k)=>a+(b-a)*k;
const ss=(a,b,x)=>sm(cl((x-a)/(b-a)));
const hs=(a,b)=>{const n=Math.sin(a*12.9898+b*78.233)*43758.5453;return n-Math.floor(n)};
const vn=(x,y)=>{const i=Math.floor(x),j=Math.floor(y),fx=sm(x-i),fy=sm(y-j),a=hs(i,j),b=hs(i+1,j),c=hs(i,j+1),d=hs(i+1,j+1);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy};
const RAMP=` .'^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$`,N=RAMP.length;
const EYES=[],ptr={x:innerWidth/2,y:innerHeight*.4,t:-1e9};
addEventListener('pointermove',e=>{ptr.x=e.clientX;ptr.y=e.clientY;ptr.t=performance.now()},{passive:true});
addEventListener('pointerdown',e=>{ptr.x=e.clientX;ptr.y=e.clientY;ptr.t=performance.now();EYES.forEach(i=>i.blink())},{passive:true});

/* S: ou = lid openness, gx/gy = gaze, pd = pupil dilation (0..1) */
function shade(S,uS,vS,o,tilt){
  const wo=.36,Ri=.148,Rp=.052*(1+.6*S.pd),cT=Math.cos(tilt),sT=Math.sin(tilt),ou=S.ou,gx=S.gx,gy=S.gy;
  const u=uS*cT-vS*sT,v=uS*sT+vS*cT;
  const vt=v-.015*(u/wo),s=u/wo,aX=cl(1-s*s);
  const vUp=(.145*ou-.015*(1-ou))*Math.pow(aX,.78)+.012*Math.sin(u*6),vLo=-(.075*(.35+.65*ou)+.015*(1-ou))*Math.pow(aX,.85);
  const du=Math.abs(vt-vUp),dl=Math.abs(vt-vLo),upper=vt>=.5*(vUp+vLo),dd=upper?du:dl;
  const mIn=ss(-.004,.008,Math.min(vUp-vt,vt-vLo))*ss(wo,wo*.92,Math.abs(u));
  const sk=.9+.2*vn(u*40+7,v*40+7);
  let sR=.62*sk,sG=.4*sk,sB=.29*sk;
  let sh=.5+.5*ss(0,.3,dd)+.1*Math.exp(-Math.pow((v+.2)/.09,2));
  if(upper)sh-=.42*Math.exp(-Math.pow((du-(.075+.03*(1-ou)))/.02,2));
  sh=cl(sh,.08,1.35);sR*=sh;sG*=sh;sB*=sh;
  let Rr=sR,Gg=sG,Bb=sB;
  if(mIn>.001){
    const eu=u-gx,ev=vt-gy,rE=Math.sqrt(eu*eu+ev*ev+1e-10),an=Math.atan2(ev,eu);
    const sc=cl(1-.85*((u*u)/(wo*wo*1.2)+(vt*vt)/.05),.35,1);
    let iR=.9*sc,iG=.87*sc,iB=.84*sc;
    const im=ss(Ri+.008,Ri-.008,rE);
    if(im>.001){const fb=.5+.5*Math.sin(an*28+1.8*vn(Math.cos(an)*3+9,Math.sin(an)*3+9));
      iR=mix(iR,mix(.52,.82,fb),im);iG=mix(iG,mix(.24,.42,fb),im);iB=mix(iB,mix(.14,.22,fb),im)}
    const pm=ss(Rp+.005,Rp-.005,rE);
    if(pm>.001){iR=mix(iR,.01,pm);iG=mix(iG,.01,pm);iB=mix(iB,.015,pm)}
    Rr=mix(sR,iR,mIn);Gg=mix(sG,iG,mIn);Bb=mix(sB,iB,mIn);
  }
  o.r=Rr*1.18;o.g=Gg*1.18;o.b=Bb*1.18;
}

/* opt: mode 'ascii' | 'pixel', fill (share of the width the eye takes), cy (eye centre as a share of the height), tilt (radians) */
function createEye(cv,opt={}){
  const ctx=cv.getContext('2d'),S={ou:0,gx:0,gy:0,pd:0},o={r:0,g:0,b:0};
  const pixel=opt.mode==='pixel',fill=opt.fill||.75,cy=opt.cy??.5,tilt=opt.tilt||0,t0=performance.now();
  let W,H,dpr,COLS,ROWS,CW,CH,hu,hv,vy,visible=true,last=0,blinkAt=-1e9,nextBlink=t0+3000,interest=0,squint=0,look=null,wander={x:0,y:0,next:0};
  function size(){
    const r=cv.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);dpr=Math.min(devicePixelRatio||1,2);
    cv.width=W*dpr;cv.height=H*dpr;
    COLS=pixel?Math.round(W/2):Math.max(48,Math.min(220,Math.floor(W/7)));CW=W/COLS;CH=pixel?CW:CW*1.8;ROWS=Math.ceil(H/CH);
    hu=Math.max(.36/fill,.22/fill*W/H);hv=hu*H/W;vy=.035-(1-2*cy)*hv;
  }
  size();new ResizeObserver(size).observe(cv);
  new IntersectionObserver(es=>{visible=es[0].isIntersecting}).observe(cv);
  function frame(){
    requestAnimationFrame(frame);const now=performance.now();
    if(!visible||document.body.classList.contains('intro-on')||now-last<33)return;
    const dt=Math.min(.1,(now-last)/1000);last=now;
    /* where to look: a pinned target, else the pointer, else wander after 4s idle */
    const r=cv.getBoundingClientRect(),ex=r.left+W/2,ey=r.top+H*cy;let tx,ty;
    if(look){tx=look.x;ty=look.y}
    else if(now-ptr.t<4000){tx=ptr.x;ty=ptr.y}
    else{if(now>wander.next){wander={x:ex+(Math.random()-.5)*innerWidth,y:ey+(Math.random()-.5)*innerHeight*.6,next:now+1200+Math.random()*2200}}tx=wander.x;ty=wander.y}
    const gx=cl((tx-ex)/(innerWidth*.45),-1,1)*.11,gy=-cl((ty-ey)/(innerHeight*.45),-1,1)*.05,k=Math.min(1,dt*10);
    S.gx+=(gx-S.gx)*k;S.gy+=(gy-S.gy)*k;S.pd+=(interest-S.pd)*Math.min(1,dt*6);
    if(now>nextBlink){blinkAt=now;nextBlink=now+2500+Math.random()*4500}
    let ou=ss(0,1,(now-t0)/1100)*(1-.45*squint);
    const bd=(now-blinkAt)/1000;if(bd>=0&&bd<=.3)ou=Math.min(ou,Math.max(.02,1-.98*Math.sin(bd/.3*Math.PI)));
    S.ou=ou;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
    if(!pixel){ctx.font=`bold ${(CH*.95).toFixed(1)}px "Courier New",Consolas,monospace`;ctx.textBaseline='alphabetic'}
    const tick=(now/120)|0;
    for(let row=0;row<ROWS;row++)for(let c=0;c<COLS;c++){
      const u=((c+.5)/COLS*2-1)*hu,v=(1-(row+.5)/ROWS*2)*hv+vy;
      /* vignette so the skin fades out around the eye instead of filling the page */
      const vg=cl(1-((u*u)/.2+((v-.035)*(v-.035))/.065));if(vg<=0)continue;
      shade(S,u,v,o,tilt);
      const f=Math.pow(vg,.8),L=Math.min(1,Math.max(o.r*.85,.299*o.r+.587*o.g+.114*o.b))*f;
      if(L<.04)continue;
      const col=`rgb(${Math.min(255,o.r*255*f)|0},${Math.min(255,o.g*255*f)|0},${Math.min(255,o.b*255*f)|0})`;
      if(pixel){ctx.fillStyle=col;ctx.fillRect(c*CW,row*CH,CW+.5,CH+.5);continue}
      const V=Math.pow(L,.667),ki=Math.round(Math.pow(V,1.5)*(N-1)+(hs(c*1.1,row+tick*3.7)-.5)*1.4);if(ki<1)continue;
      ctx.fillStyle=col;ctx.fillText(RAMP[Math.min(ki,N-1)],c*CW,row*CH+CH*.82);
    }
  }
  requestAnimationFrame(frame);
  const api={
    blink(){blinkAt=performance.now()},
    interest(on){interest=on?1:0},          /* pupil widens */
    squint(on){squint=on?1:0},              /* lids narrow */
    lookAt(p){look=p}                       /* {x,y} in viewport px, or null to follow the pointer again */
  };
  EYES.push(api);return api;
}
window.Eye={create:createEye,all:EYES};
})();
