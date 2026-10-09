// Course PRs, for admins and coaches: a view on the Projections tab with each 2026 roster athlete's fastest clock time on the next
// scheduled meet's course, at the distance of their race there (one decimal, girls and boys side by side for a screenshot).
// Web build only; build.py adds it after the portal script and gate.js sets DH_ROLE first.
(function(){
 if(!['admin','coach'].includes(window.DH_ROLE))return;
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'});
 const m=[...sched].sort((a,b)=>a.date.localeCompare(b.date)).find(x=>x.date>=today);if(!m)return;
 const roster=D.runners.filter(r=>r.active),key=meetKey(m);
 // times to one decimal, rounded up to the next tenth as timing rules do (8:13.94 shows 8:14.0, 7:20.25 shows 7:20.3)
 const f1=v=>{const t=Math.ceil(v*10-1e-6)/10,mm=Math.floor(t/60),s=(t-mm*60).toFixed(1);return mm+':'+(s<10?'0':'')+s};
 const grade=r=>{try{return gradeAge(r).short||''}catch(e){return ''}};
 // the distance each athlete races at this meet; without an entry, the distance most of their gender race there
 const entry=r=>(r.upcoming||[]).find(u=>u.date+'|'+u.meet===key&&raceDist(u)>0);
 const usual=g=>{const c=new Map();roster.forEach(r=>{const u=r.gender===g&&entry(r);if(u){const d=raceDist(u).toFixed(2);c.set(d,(c.get(d)||0)+1)}});
  const top=[...c].sort((a,b)=>b[1]-a[1])[0];return top?+top[0]:null};
 // fastest clock time on this course at that distance; with none, the nearest distance raced there within 25%
 const best=(r,want)=>{if(!want)return null;const xs=r.races.filter(x=>x.course===m.course&&raceDist(x)>0&&Math.abs(raceDist(x)/want-1)<=.25&&clockSecs(x.time)>0);
  if(!xs.length)return null;const d=xs.map(raceDist).sort((a,b)=>Math.abs(a-want)-Math.abs(b-want))[0];
  return xs.filter(x=>Math.abs(raceDist(x)-d)<.02).sort((a,b)=>clockSecs(a.time)-clockSecs(b.time))[0]};
 const table=g=>{const u0=usual(g),rows=roster.filter(r=>r.gender===g).map(r=>{const u=entry(r),want=u?raceDist(u):u0;return {r,want,x:best(r,want)}});
  const has=rows.filter(o=>o.x),none=rows.filter(o=>!o.x);
  has.sort((a,b)=>raceDist(a.x)-raceDist(b.x)||clockSecs(a.x.time)-clockSecs(b.x.time)||a.r.name.localeCompare(b.r.name));
  const mixed=new Set(has.map(o=>raceDist(o.x).toFixed(2))).size>1,off=o=>Math.abs(raceDist(o.x)-o.want)>=.02;
  return `<div><h3 style="margin:0 0 10px">${g==='F'?'Girls':'Boys'} <span class="sub" style="font:500 14px var(--body)">${has.length} of ${rows.length}</span></h3>
  <div class="scroll"><table class="nostick"><tr><th class="n">#</th><th>Athlete</th><th class="n">PR</th>${mixed?'<th>Dist</th>':''}<th>Meet</th></tr>
  ${has.map((o,i)=>`<tr><td class="n">${i+1}</td><td class="w"><a href="#" data-cpr="${esc(o.r.id)}">${esc(o.r.name)}</a><span class="rm">${esc(grade(o.r))}</span></td>
   <td class="n" style="font:700 20px/1 var(--cond)">${f1(clockSecs(o.x.time))}${off(o)?'<sup class="fn">*</sup>':''}</td>${mixed?`<td>${distLabel(raceDist(o.x))}</td>`:''}
   <td class="w">${esc(o.x.meet)}<span class="rm">${fdate(o.x.date)}</span></td></tr>`).join('')||`<tr><td colspan="5" class="empty">No races on this course yet.</td></tr>`}</table></div>
  ${has.some(off)?`<p class="sub" style="margin-top:8px">* Not raced at this meet's distance here; nearest distance shown.</p>`:''}
  ${none.length?`<p class="sub" style="margin-top:8px">No race here at this distance: ${none.map(o=>esc(o.r.name)).join(', ')}</p>`:''}</div>`};

 const sec=$('#roster'),kids=[...sec.children];
 const bar=document.createElement('div');bar.className='bar';bar.id='cprBar';
 bar.innerHTML='<button class="chip" data-cv="exp" aria-pressed="true">Expected</button><button class="chip" data-cv="pr" aria-pressed="false">Course PRs</button>';
 const view=document.createElement('div');view.id='cprView';view.hidden=true;
 view.innerHTML=`<h2>${esc(m.meet)}: course PRs</h2>
  <p class="sub">${fdate(m.date)} at ${esc(courseShort(m.course))}. 2026 roster, fastest clock time on this course at the distance of each athlete's race at this meet. Data as of ${fdate(D.meta.as_of)}.</p>
  <style>#cprGrid{display:grid;grid-template-columns:minmax(0,1fr);gap:28px}@media(min-width:900px){#cprGrid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}#cprGrid td,#cprGrid th{padding-top:7px;padding-bottom:7px}</style>
  <div id="cprGrid">${m.new_course?'<p class="sub">No results from this course yet.</p>':table('F')+table('M')}</div>`;
 sec.prepend(bar);sec.appendChild(view);
 const set=v=>{bar.querySelectorAll('[data-cv]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.cv===v));kids.forEach(k=>k.hidden=v==='pr');view.hidden=v!=='pr';
  try{localStorage.setItem('dh_cpr',v)}catch(e){}};
 bar.querySelectorAll('[data-cv]').forEach(b=>b.onclick=()=>set(b.dataset.cv));
 view.querySelectorAll('a[data-cpr]').forEach(a=>a.onclick=e=>{e.preventDefault();openRunner(a.dataset.cpr)});
 try{if(localStorage.getItem('dh_cpr')==='pr')set('pr')}catch(e){}
})();
