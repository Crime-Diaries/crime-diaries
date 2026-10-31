/* Posts store: comments and theories on each case.
   For now everything lives in this browser's localStorage. Every function is async and returns plain data,
   so a database version (fetch() to an API) can replace this file without touching the pages. */
window.Posts=(()=>{
const KEY='cd_posts_v1',VOTES='cd_votes_v1';
const read=k=>{try{return JSON.parse(localStorage.getItem(k))||{}}catch{return {}}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);

/* kind: 'comment' | 'theory'. Newest first, reported posts left out. */
async function list(caseId,kind){
  const all=read(KEY)[caseId]||[],voted=read(VOTES);
  return all.filter(p=>p.kind===kind&&!p.reported).map(p=>({...p,voted:!!voted[p.id]})).sort((a,b)=>b.at-a.at);
}
async function counts(caseId){
  const all=(read(KEY)[caseId]||[]).filter(p=>!p.reported);
  return {comment:all.filter(p=>p.kind==='comment').length,theory:all.filter(p=>p.kind==='theory').length};
}
async function add(caseId,kind,{name,text}){
  text=String(text||'').trim();name=String(name||'').trim().slice(0,40)||'Anonymous';
  if(text.length<3)throw new Error('Write a little more before posting.');
  if(text.length>2000)throw new Error('Keep it under 2,000 characters.');
  const db=read(KEY),post={id:uid(),kind,name,text,at:Date.now(),votes:0,reported:false};
  (db[caseId]=db[caseId]||[]).push(post);write(KEY,db);return post;
}
/* one vote per post per browser; voting again takes it back */
async function vote(caseId,id){
  const db=read(KEY),voted=read(VOTES),p=(db[caseId]||[]).find(x=>x.id===id);if(!p)return null;
  if(voted[id]){p.votes--;delete voted[id]}else{p.votes++;voted[id]=1}
  write(KEY,db);write(VOTES,voted);return {votes:p.votes,voted:!!voted[id]};
}
/* a real backend would queue this for a moderator; here the post is hidden */
async function report(caseId,id){
  const db=read(KEY),p=(db[caseId]||[]).find(x=>x.id===id);if(p){p.reported=true;write(KEY,db)}
}
return {list,counts,add,vote,report};
})();
