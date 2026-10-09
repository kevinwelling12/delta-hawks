// TEMPORARY, admins only: each active roster athlete's PR at American River College, at 2 km or the nearest distance
// they ran there (1.5 to 2.5 km). Web build only; build.py adds it after the portal script and gate.js sets DH_ROLE first.
// To remove: delete this file and its line in build.py.
(function(){
 if(window.DH_ROLE!=='admin')return;
 const ARC=/american river/i,KM=1/1.609344,lo=1.5*KM,hi=2.5*KM,two=2*KM;
 const best=r=>{const xs=r.races.filter(x=>ARC.test(x.course||'')&&raceDist(x)>=lo&&raceDist(x)<=hi&&clockSecs(x.time)>0);if(!xs.length)return null;
  const d=xs.map(raceDist).sort((a,b)=>Math.abs(a-two)-Math.abs(b-two))[0];
  return xs.filter(x=>Math.abs(raceDist(x)-d)<.02).sort((a,b)=>clockSecs(a.time)-clockSecs(b.time))[0]};
 const roster=D.runners.filter(r=>r.active);
 // times to one decimal, rounded up to the next tenth as timing rules do (8:13.94 shows 8:14.0, 7:20.25 shows 7:20.3)
 const f1=v=>{const t=Math.ceil(v*10-1e-6)/10,m=Math.floor(t/60),r=(t-m*60).toFixed(1);return m+':'+(r<10?'0':'')+r};
 const grade=r=>{try{return gradeAge(r).short||''}catch(e){return ''}};
 const table=g=>{const rows=roster.filter(r=>r.gender===g).map(r=>({r,x:best(r)})),has=rows.filter(o=>o.x),none=rows.filter(o=>!o.x);
  has.sort((a,b)=>raceDist(a.x)-raceDist(b.x)||clockSecs(a.x.time)-clockSecs(b.x.time)||a.r.name.localeCompare(b.r.name));
  const mixed=new Set(has.map(o=>raceDist(o.x).toFixed(2))).size>1;
  return `<div><h3 style="margin:0 0 10px">${g==='F'?'Girls':'Boys'} <span class="sub" style="font:500 14px var(--body)">${has.length} of ${rows.length}</span></h3>
  <div class="scroll"><table class="nostick"><tr><th class="n">#</th><th>Athlete</th><th class="n">PR</th>${mixed?'<th>Dist</th>':''}<th>Meet</th></tr>
  ${has.map((o,i)=>`<tr><td class="n">${i+1}</td><td class="w"><a href="#" data-arc="${esc(o.r.id)}">${esc(o.r.name)}</a><span class="rm">${esc(grade(o.r))}</span></td>
   <td class="n" style="font:700 20px/1 var(--cond)">${f1(clockSecs(o.x.time))}</td>${mixed?`<td>${distLabel(raceDist(o.x))}</td>`:''}
   <td class="w">${esc(o.x.meet)}<span class="rm">${fdate(o.x.date)}</span></td></tr>`).join('')||`<tr><td colspan="4" class="empty">No ARC races yet.</td></tr>`}</table></div>
  ${none.length?`<p class="sub" style="margin-top:8px">No ARC race: ${none.map(o=>esc(o.r.name)).join(', ')}</p>`:''}</div>`};
 const sec=document.createElement('section');sec.id='arcpr';sec.setAttribute('role','tabpanel');
 sec.innerHTML=`<h2>PRs at American River College</h2>
  <p class="sub">2026 roster, fastest clock time at 2 km (or the nearest distance raced there, 1.5 to 2.5 km). Data as of ${fdate(D.meta.as_of)}. Admins only, temporary.</p>
  <style>#arcGrid{display:grid;grid-template-columns:minmax(0,1fr);gap:28px}@media(min-width:900px){#arcGrid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}#arcGrid td,#arcGrid th{padding-top:7px;padding-bottom:7px}</style>
  <div id="arcGrid">${table('F')}${table('M')}</div>`;
 document.querySelector('main.wrap').appendChild(sec);
 const b=document.createElement('button');b.setAttribute('role','tab');b.setAttribute('aria-selected','false');b.dataset.tab='arcpr';b.textContent='ARC PRs';
 b.onclick=()=>show('arcpr');document.querySelector('.tabs-in').appendChild(b);
 sec.querySelectorAll('a[data-arc]').forEach(a=>a.onclick=e=>{e.preventDefault();openRunner(a.dataset.arc)});
 try{if(localStorage.getItem('dh_tab')==='arcpr')show('arcpr')}catch(e){}
})();
