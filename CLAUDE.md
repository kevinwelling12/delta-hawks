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
  Serve local test pages only on this Mac: `python3 -m http.server --bind 127.0.0.1 PORT` from the scratchpad,
  never the pipeline's portal/ folder on all interfaces (a server like that exposed every athlete's data
  on the home Wi-Fi until 2026-09-27).
- Gate behavior (src/gate.js): first visit on a device checks members/{email}, downloads the portal,
  saves the gzipped copy in IndexedDB and remembers the member in localStorage ('dh-member'). Return
  visits open from that copy at once and check membership and version in the background (removed:
  clear and reload to "Not on the list"; newer: download and show a reload note). "Loading..." shows
  only after 600 ms (inline script in gate.html, which also covers gate.js failing); gate.js has a
  20 s watchdog naming the stuck step. If the portal script errors on start, the copy is dropped and
  the page reloads once. Pull to refresh exists only in the home screen web app (standalone).
  The footer shows a version stamp (build time Pacific + commit) to tell whether an update arrived;
  GitHub Pages sends max-age=600, so devices can hold a page for 10 minutes.
- "This week" tab: build.py reads the latest practice schedule from the club blog (scripts/week_schedule.py: the
  RSS feed for links, then the post page, since the feed is cut off) and adds the tab to both web portals. Nothing is
  saved in the repo. pages.yml rebuilds every 3 hours so a new Sunday post appears on its own; if the blog can't be
  read the pages build without the tab. `python3 build.py --no-schedule` skips it. Not in the claude.ai build.
- Don't call db.settings() with long-polling options: this SDK auto-detects by default and throws if forced.
- Kevin prefers plain, direct writing: no em dashes, no filler.
