// Who's going, for admins: set Going (yes, maybe, no) for each 2026 roster athlete at an upcoming meet, from the Projections tab.
// Each meet is one Firestore doc, entries/{date|meet} {meet, date, going: {Name: yes|no|maybe|''}, updated, by}; '' clears a name.
// The pipeline (scripts/sync_entries.py, hourly in GitHub Actions) copies it into data/entries.csv and rebuilds, so places and the
// simulation follow within the hour. D.meta.entries is entries.csv as of the last rebuild, which shows what is already published.
// Web build only (XC); build.py adds it after the portal script, and gate.js sets DH_ROLE, DH_DB and DH_EMAIL first.
(function(){
 if(window.DH_ROLE!=='admin'||!window.DH_DB)return;
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'});
 const up=[...sched].filter(m=>m.date>=today).sort((a,b)=>a.date.localeCompare(b.date));if(!up.length)return;
 const db=window.DH_DB,pub=D.meta.entries||{},ids=new Map(D.runners.map(r=>[r.id,r]));
 const roster=(D.meta.roster||[]).map(r=>({name:r.name,g:r.gender||(ids.get(r.id)||{}).gender||''})).sort((a,b)=>a.name.localeCompare(b.name));
 const docId=k=>k.replace(/\//g,'-');
 const V=[['yes','Yes'],['maybe','Maybe'],['no','No']],WORD={yes:'going',maybe:'maybe',no:'not going','':'no reply'};

 const css=document.createElement('style');
 css.textContent=`#dh-entries{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.55);overflow:auto}
#dh-entries .dh-panel{max-width:620px;margin:4vh auto;background:var(--bg);border-radius:10px;padding:22px var(--pad) 26px}
#dh-entries ul{list-style:none;margin:6px 0 18px;padding:0}
#dh-entries li{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--line,rgba(127,127,127,.25))}
#dh-entries li span{min-width:0;overflow:hidden;text-overflow:ellipsis}
#dh-entries li small{display:block;color:var(--faint);font-size:12px}
#dh-entries .ev{display:flex;gap:6px;flex:none}
#dh-entries .ev .chip{min-height:36px;padding:0 10px;font-size:14px}
#dh-entries .ev .chip[data-v="no"][aria-pressed="true"]{background:var(--muted);border-color:var(--muted)}
#dh-entries select{min-height:42px;max-width:100%;font-size:16px}`;
 document.head.appendChild(css);
 const ov=document.createElement('div');ov.id='dh-entries';ov.hidden=true;
 ov.innerHTML=`<div class="dh-panel"><div class="dh-head"><h2 style="margin:0">Who's going</h2><button class="chip" data-x="close">Close</button></div>
  <div class="bar" style="margin-top:12px"><select id="enMeet" aria-label="Meet">${up.map(m=>`<option value="${esc(meetKey(m))}">${esc(m.meet)}, ${fdate(m.date)}</option>`).join('')}</select></div>
  <p class="sub" id="enSum"></p><div id="enBody"><p class="sub">Loading…</p></div>
  <p class="sub">Tap again to clear. Once anyone is Yes, athletes left with no reply drop off this meet's projections. Changes reach the projections, places and simulation at the next hourly check (about 15 minutes before the hour, 6 am to 10 pm), then the rebuild takes about 8 minutes.</p></div>`;
 document.body.appendChild(ov);
 let key=null,live={},busy=0;
 const val=n=>n in live?live[n]:(pub[key]||{})[n]||'';
 const pubv=n=>(pub[key]||{})[n]||'';
 function draw(){
  const n={yes:0,maybe:0,no:0,'':0};roster.forEach(r=>n[val(r.name)]++);
  const pend=roster.filter(r=>val(r.name)!==pubv(r.name)).length;
  $('#enSum').textContent=`${n.yes} going, ${n.maybe} maybe, ${n.no} not going, ${n['']} no reply.`+(pend?` ${pend} change${pend>1?'s':''} not in the projections yet.`:busy?'':' All in the projections.');
  const grp=(t,rs)=>rs.length?`<h3 style="margin:14px 0 0">${t}</h3><ul>${rs.map(r=>{const v=val(r.name);return `<li><span>${esc(r.name)}${v!==pubv(r.name)?`<small>Was ${WORD[pubv(r.name)]} in the projections</small>`:''}</span>
   <span class="ev">${V.map(([k,l])=>`<button class="chip" data-n="${esc(r.name)}" data-v="${k}" aria-pressed="${v===k}">${l}</button>`).join('')}</span></li>`}).join('')}</ul>`:'';
  $('#enBody').innerHTML=grp('Girls',roster.filter(r=>r.g==='F'))+grp('Boys',roster.filter(r=>r.g==='M'))+grp('Others',roster.filter(r=>r.g!=='F'&&r.g!=='M'));
 }
 async function load(k){
  key=k;live={};$('#enBody').innerHTML='<p class="sub">Loading…</p>';$('#enSum').textContent='';
  try{const d=await db.doc('entries/'+docId(k)).get();if(key!==k)return;live=d.exists?{...(d.data().going||{})}:{};draw()}
  catch(e){$('#enBody').innerHTML=`<p class="note">Couldn't load who's going (${esc(e.code||e.message)}).</p>`}
 }
 async function set(name,v){
  const k=key,m=up.find(x=>meetKey(x)===k),was=name in live?live[name]:undefined,nv=val(name)===v?'':v;
  live[name]=nv;busy++;draw();
  try{await db.doc('entries/'+docId(k)).set({meet:m.meet,date:m.date,going:{[name]:nv},updated:new Date().toISOString(),by:window.DH_EMAIL},{merge:true})}
  catch(e){if(key===k){if(was===undefined)delete live[name];else live[name]=was}alert(`Not saved (${e.code||e.message}). Please try again.`)}
  finally{busy--;if(key===k)draw()}
 }
 ov.addEventListener('click',e=>{const b=e.target.closest('button');if(e.target===ov||(b&&b.dataset.x==='close')){ov.hidden=true;return}
  if(b&&b.dataset.v)set(b.dataset.n,b.dataset.v)});
 $('#enMeet').onchange=e=>load(e.target.value);
 // button next to the meet menu on the Projections tab, for upcoming meets only
 const btn=document.createElement('button');btn.className='chip';btn.textContent="Who's going";btn.id='enOpen';
 $('#meetSel').parentNode.appendChild(btn);
 const sync=()=>{btn.hidden=!up.some(m=>meetKey(m)===$('#meetSel').value)};
 $('#meetSel').addEventListener('change',sync);sync();
 btn.onclick=()=>{const k=up.some(m=>meetKey(m)===$('#meetSel').value)?$('#meetSel').value:meetKey(up[0]);$('#enMeet').value=k;ov.hidden=false;load(k)};
})();
