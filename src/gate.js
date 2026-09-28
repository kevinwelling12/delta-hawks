// Sign-in gate for the web build. The page ships with no athlete data: after Google sign-in, the
// signed-in email must be on the members list (Firestore members/{email}); the security rules then let
// the browser read the portal data (portals/{xc|track}, gzipped JSON in chunks). The data is cached in
// IndexedDB by version, so a normal visit costs two small reads. Then the portal's own script runs
// exactly as in the claude.ai build.
(function () {
  const KEY = window.DH_PORTAL, $ = s => document.querySelector(s);
  const gate = $('#dh-gate'), box = $('#dh-gate .dh-box');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const show = html => { box.innerHTML = html; gate.hidden = false; };

  if (!window.firebase || !window.FIREBASE_CONFIG) {
    show('<h2>Not set up yet</h2><p>This site has no Firebase project configured. See docs/setup.md.</p>');
    return;
  }
  firebase.initializeApp(window.FIREBASE_CONFIG);
  const auth = firebase.auth(), db = firebase.firestore();
  // Safari on iPhone can stall Firestore's default streaming connection; long polling is the reliable path there
  db.settings({ experimentalForceLongPolling: true, merge: true });
  if (window.DH_EMULATOR) { auth.useEmulator('http://127.0.0.1:9099'); db.useEmulator('127.0.0.1', 8080); }
  let me = null, started = false;

  // ---- IndexedDB cache: one record per portal, {version, text}
  const idb = () => new Promise((res, rej) => {
    const r = indexedDB.open('delta-hawks', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('portals');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const cacheGet = async k => { try { const d = await idb(); return await new Promise(res => { const q = d.transaction('portals').objectStore('portals').get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); } catch (e) { return null; } };
  const cachePut = async (k, v) => { try { const d = await idb(); d.transaction('portals', 'readwrite').objectStore('portals').put(v, k); } catch (e) {} };
  const cacheClear = async () => { try { const d = await idb(); await new Promise(res => { const t = d.transaction('portals', 'readwrite'); t.objectStore('portals').clear(); t.oncomplete = t.onerror = t.onabort = res; }); } catch (e) {} };

  // who was let in on this device last time (for opening from the saved copy while the check runs)
  const memo = { get: () => { try { return JSON.parse(localStorage.getItem('dh-member') || 'null'); } catch (e) { return null; } },
                 set: v => { try { localStorage.setItem('dh-member', JSON.stringify(v)); } catch (e) {} },
                 clear: () => { try { localStorage.removeItem('dh-member'); } catch (e) {} } };
  const timeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('The connection timed out.'), { code: 'timeout' })), ms))]);

  async function gunzip(bytes) {
    if (!window.DecompressionStream) throw new Error('This browser is too old to open the portal. Please update it.');
    const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(s).text();
  }
  async function loadData() {
    const cached = await cacheGet(KEY);
    let meta;
    try { meta = await db.doc('portals/' + KEY).get(); }
    catch (e) { if (cached) return cached; throw e; }            // offline: use the last copy on this device
    if (!meta.exists) throw new Error('No results have been published yet.');
    const m = meta.data();
    if (cached && cached.version === m.version) return cached;
    const parts = await Promise.all(Array.from({ length: m.chunks }, (_, i) =>
      db.doc(`portals/${KEY}/chunks/${String(i).padStart(3, '0')}`).get()));
    const arrs = parts.map(p => p.data().data.toUint8Array()), all = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0));
    let o = 0; arrs.forEach(a => { all.set(a, o); o += a.length; });
    const rec = { version: m.version, updated: m.updated, text: await gunzip(all) };
    cachePut(KEY, rec);
    return rec;
  }
  function runApp(text) {
    $('#data').textContent = text;
    document.querySelectorAll('script[type="text/x-dh-app"]').forEach(s => {
      const n = document.createElement('script'); n.textContent = s.textContent; document.body.appendChild(n);
    });
  }

  // ---- account line in the footer, members panel for admins
  function accountLine() {
    const foot = $('footer.foot'); if (!foot || $('#dh-acct')) return;
    const p = document.createElement('p'); p.id = 'dh-acct'; p.style.margin = '6px 0 0';
    p.innerHTML = `Signed in as ${esc(me.email)}${me.role === 'admin' ? ' · <a href="#" data-dh="members">Members</a>' : ''} · <a href="#" data-dh="signout">Sign out</a>`;
    foot.appendChild(p);
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-dh]'); if (!a) return; e.preventDefault();
    const act = a.dataset.dh;
    if (act === 'signin') { lastErr = null; signIn(); }
    else if (act === 'retry') location.reload();
    else if (act === 'signout') { cacheClear(); memo.clear(); auth.signOut().then(() => location.reload()); }
    else if (act === 'members') openMembers();
    else if (act === 'close') $('#dh-members').hidden = true;
    else if (act === 'remove') removeMember(a.dataset.email);
  });

  async function openMembers() {
    const panel = $('#dh-members'); panel.hidden = false;
    const body = panel.querySelector('.dh-list'); body.innerHTML = '<p class="sub">Loading…</p>';
    try {
      const snap = await db.collection('members').get();
      const rows = snap.docs.map(d => ({ email: d.id, ...d.data() })).sort((a, b) => a.role.localeCompare(b.role) || a.email.localeCompare(b.email));
      body.innerHTML = `<ul class="list">${rows.map(r => `<li><span class="ln">${esc(r.name || r.email)}</span><span class="lm">${esc(r.email)} · ${esc(r.role)}</span>
        <span class="lt">${r.email === me.email ? '<small>You</small>' : `<button class="chip" data-dh="remove" data-email="${esc(r.email)}">Remove</button>`}</span></li>`).join('')}</ul>`;
    } catch (e) { body.innerHTML = `<p class="note">${esc(e.message)}</p>`; }
  }
  async function removeMember(email) {
    if (!confirm(`Remove ${email}? They will lose access right away.`)) return;
    try { await db.doc('members/' + email).delete(); openMembers(); } catch (e) { alert(e.message); }
  }
  document.addEventListener('submit', async e => {
    if (e.target.id !== 'dh-add') return; e.preventDefault();
    const f = e.target, email = f.email.value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { alert('Enter an email address.'); return; }
    try {
      await db.doc('members/' + email).set({ role: f.role.value, name: f.name.value.trim(), added: new Date().toISOString().slice(0, 10), by: me.email });
      f.reset(); openMembers();
    } catch (e2) { alert(e2.message); }
  });

  // Links opened inside another app (Gmail, Facebook, Instagram, the Google app...) use a built-in browser
  // that Google blocks for sign-in and that loses the sign-in state; ask for Safari or Chrome instead.
  const inApp = /FBAN|FBAV|FB_IAB|Instagram|Line\/|GSA\/|LinkedInApp|Snapchat|Twitter|MicroMessenger|; wv\)/.test(navigator.userAgent);
  const openHint = '<p class="sub">If you opened this link inside another app (Gmail, Messages preview, Facebook, the Google app), use its menu to <b>Open in Safari</b> (or Chrome), then sign in there.</p>';
  async function signIn() {
    const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    try { await auth.signInWithPopup(p); }
    catch (e) {
      const c = e.code || '';
      if (c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment') return auth.signInWithRedirect(p);
      if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request' || c === 'auth/user-cancelled') return;   // they closed the Google window: stay on the sign-in card
      failed(e);
    }
  }
  let lastErr = null;
  function failed(e) {
    lastErr = e;
    show(`<h2>Sign-in didn't finish</h2><p>Please tap the button to try again.</p>
      <p><button class="chip dh-go" data-dh="signin">Sign in with Google</button></p>${openHint}
      <p class="sub" style="margin-top:18px">Details: ${esc(e.message || e)}</p>`);
  }
  const signInCard = () => show(`<h2>Delta Hawks results</h2><p>This portal is for invited members of the club. Sign in with the Google account your invite was sent to.</p>
    ${inApp ? '<p class="note">This page is open inside another app, where Google sign-in does not work. Use the app\'s menu to <b>Open in Safari</b> (or Chrome), then sign in there.</p>' : ''}
    <p><button class="chip dh-go" data-dh="signin">Sign in with Google</button></p>`);

  auth.getRedirectResult().catch(failed);
  const start = (rec, role, email) => { me = { email, role }; started = true; runApp(rec.text); accountLine(); gate.hidden = true; };
  const stalled = e => show(`<h2>Couldn't load the results</h2><p>${esc(e.message || e)} This is usually a weak connection.</p>
    <p><button class="chip dh-go" data-dh="retry">Try again</button> <button class="chip" data-dh="signout">Sign out</button></p>`);
  const notInvited = email => { cacheClear(); memo.clear();          // removed members keep nothing on the device
    show(`<h2>Not on the list yet</h2><p>${esc(email)} hasn't been invited. Ask Kevin to add this address, or sign in with a different Google account.</p>
      <p><button class="chip" data-dh="signout">Use a different account</button></p>`); };
  const checkMember = async email => { const d = await timeout(db.doc('members/' + email).get(), 12000); return d.exists ? d.data() : null; };

  auth.onAuthStateChanged(async user => {
    if (!user) { lastErr ? failed(lastErr) : signInCard(); return; }
    if (started) return;
    const email = (user.email || '').toLowerCase(), known = memo.get(), cached = await cacheGet(KEY);

    // Seen here before: open the saved copy now, then check membership and newer results in the background.
    if (known && known.email === email && cached) {
      start(cached, known.role, email);
      try {
        const m = await checkMember(email);
        if (!m) { await cacheClear(); memo.clear(); location.reload(); return; }   // removed: reload shows "Not on the list"
        memo.set({ email, role: m.role });
        const meta = await timeout(db.doc('portals/' + KEY).get(), 12000);
        if (meta.exists && meta.data().version !== cached.version) { await loadData(); newResults(); }
      } catch (e) {}                                              // offline or slow: keep showing the saved copy
      return;
    }

    show('<h2>Delta Hawks results</h2><p class="sub">Checking your invite…</p>');
    let m;
    try { m = await checkMember(email); } catch (e) { stalled(e); return; }
    if (!m) { notInvited(email); return; }
    memo.set({ email, role: m.role });
    show('<h2>Delta Hawks results</h2><p class="sub">Loading results…</p>');
    try { start(await timeout(loadData(), 45000), m.role, email); } catch (e) { stalled(e); }
  });
  function newResults() {                                         // newer results were saved in the background
    const main = $('main.wrap'); if (!main || $('#dh-new')) return;
    const n = document.createElement('p'); n.id = 'dh-new'; n.className = 'note'; n.style.marginTop = '0';
    n.innerHTML = 'New results are available. <a href="#" data-dh="retry">Reload to see them</a>.';
    main.prepend(n);
  }
})();
