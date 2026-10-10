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
  clear and reload to "Not on the list"; newer: download and show a reload note). On a first visit, a read refused
  right after Google sign-in (Firestore not yet holding the new token) gets a fresh token and two retries before
  the error card; the card names the error code and step (2026-10-02, a new user's first load failed until reload). "Loading..." shows
  only after 600 ms (inline script in gate.html, which also covers gate.js failing); gate.js has a
  20 s watchdog naming the stuck step. If the portal script errors on start, the copy is dropped and
  the page reloads once. Pull to refresh exists only in the home screen web app (standalone).
  The footer shows a version stamp (build time Pacific + commit) to tell whether an update arrived;
  GitHub Pages sends max-age=600, so devices can hold a page for 10 minutes.
- "This week" tab: build.py reads the latest practice schedule from the club blog (scripts/week_schedule.py: the
  RSS feed for links, then the post page, since the feed is cut off) and adds the tab to both web portals. Nothing is
  saved in the repo. pages.yml rebuilds every 3 hours so a new Sunday post appears on its own; if the blog can't be
  read the pages build without the tab. `python3 build.py --no-schedule` skips it. Not in the claude.ai build.
- Course PRs (XC Projections tab, admins and coaches, web build only: src/course_prs.js): a second view next to Expected with each
  2026 roster athlete's fastest clock time on the next scheduled meet's course, at their race distance there (one decimal,
  rounded up to the tenth), girls and boys side by side for a screenshot. Hide it from the 'family' role if that is ever added.
- Meet report (XC Meets tab, Report view, the default; Results is the old race table): one Hawks club meet at a glance
  for the staff. A race lists whoever ran for the Delta Hawks in it, by the results row's team (past Hawks show at past
  meets, not at later meets for other teams; Unattached counts only for the active roster). On a tied place the row with the
  athlete's name wins, else the one Hawks row (2026-10-06: before that the last tied row won, which dropped Hawks tied with
  another team's runner). Expected times come from the pipeline's scripts/meet_reports.py as D.reports = {v, since, x: {"date|meet|
  race|place|floor(seconds)": [expected, lo, hi]}}: the projection on the morning of the meet (strict refit), shifted by the
  median of how the rest of the race ran against their own projections, with the 80% range. Without D.reports the report
  still shows PBs, course bests, records, team scores and the day, with a note. Team scores are unofficial (full fields,
  teams of 5+, 6th and 7th displace); meets with other rules go in SCORING by "date|meet", e.g. American River Open and PR Palooza 2026: teams of 3+, 4th and 5th displace; Palooza checked against the timer's points). Highlights and Check in with were removed (2026-10-06): everything sits in the race tables, with badges (record, PB,
  course best, top 10, first race) and notes under the name (the record's rank, a second club race in a row past range). Results are shown in seconds against
  expected ("14 s faster", "right on it", "49 s slower"), with the likely (80%) range as times under Expected and "inside
  range", "ahead of range by N s" or "past range by N s" beneath; green and red only outside the range (2026-10-05; replaced
  five % bands, which read as mixed signals when ranges differed in width). On phones the Expected column is hidden: "exp 7:47" sits under
  the time and the result line carries the range ("inside 6:42 to 9:02", "past 8:19 by 16 s"). Results past range (slower than likely) are for the coaches: hide them, or the
  report, if the 'family' role is ever added.
- Don't call db.settings() with long-polling options: this SDK auto-detects by default and throws if forced.
- Kevin prefers plain, direct writing: no em dashes, no filler.
