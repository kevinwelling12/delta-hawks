# CLAUDE.md: Delta Hawks web portals

Public repo. Never add athlete data, names, CSV or JSON data files here. The data pipeline lives in
the sibling folder ../delta-hawks (private, not in git; read its CLAUDE.md for the model and data).

- templates/: the portal pages, the single source for both builds. The claude.ai build injects data
  with ../delta-hawks/scripts/build_portal.py; this repo's build.py leaves the data block empty and
  defers the portal's script until src/gate.js has signed the user in and loaded the data.
- Firestore: members/{email lowercase} {role: admin|coach, name, added, by}; portals/{xc|track}
  {version, chunks, bytes, as_of, updated}; portals/{key}/chunks/NNN {data: gzipped JSON bytes}.
  Rules in firestore.rules (publish them in the Firebase console after editing). 'family' role is
  reserved: before adding it, decide what families see (own runner only, or team views with first
  name + last initial) and split the data so the rules can enforce it.
- Test: no Java on the Mac, so no Firestore emulator. Two checks after any gate change:
  1. Real SDK: load the built page (or the live site) in Playwright WebKit (desktop and iPhone) and
     confirm the sign-in card appears with no page errors. A stub Firebase missed a settings() call
     that threw in the real SDK and blanked the page in every browser (2026-09-27).
  2. Signed-in flows: stub Firebase serving the real chunks, in WebKit: first visit, return visit
     (saved copy), newer version, removed member, stalled connection.
  Also check the live rules: an unauthenticated read of portals/xc must be denied.
- Don't call db.settings() with long-polling options: this SDK auto-detects by default and throws if forced.
- Kevin prefers plain, direct writing: no em dashes, no filler.
