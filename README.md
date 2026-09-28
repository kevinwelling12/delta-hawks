# Delta Hawks portals (web)

Invite-only web version of the Delta Hawks cross country and track & field results portals.

- Hosting: GitHub Pages (this repo, built by .github/workflows/pages.yml on every push to main).
- Sign-in: Google, through Firebase Auth. Only emails on the members list get in.
- Data: not in this repo and not in the page. After sign-in the browser reads it from Firestore,
  which only allows invited members (firestore.rules). It is uploaded from the private pipeline by
  `scripts/publish_web.py` and cached per device (IndexedDB) by version.

    python3 build.py              # dist/index.html (cross country), dist/track.html
    python3 build.py --emulator   # pointed at local Firebase emulators (demo project)

Layout: `templates/` the two portal pages (shared with the claude.ai build), `src/` the sign-in gate
(gate.js, gate.html, gate.css) and Firebase config, `docs/setup.md` one-time account setup.
