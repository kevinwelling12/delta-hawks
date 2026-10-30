# Family view (design, 2026-10-30)

Status: spec, not built. Decisions made 2026-10-30 are marked (decided). Open items are at the end.

## What families get

- Their own runner first (decided): the portal opens on their runner's page. Siblings get a switch at the top.
- Team views with full names (decided): meet results and records for every Hawk, as athletic.net shows them.
- No model numbers in v1 (decided): no expected times, ranges, projections, equivalents, simulations or
  "faster/slower than expected" lines, for their own runner or anyone else.
- No Live tab (decided): families follow meet day on the timer's own site.
- "This week" practice schedule: same tab as the staff build.
- Admin adds families (decided): Members panel, role "family", plus a runner picker.

### Runner page (home)

1. Next meet: date, meet, race, start time, course. No expected time.
2. Last race: clock time, place, mile pace, badges (PB, course best, first race, top 10).
3. Season so far: clock times by meet. A chart only if it reads well without equivalents (same course
   and distance across meets is rare in XC, so a list may be better).
4. Race history: every race, newest first, with mile pace.

### Tabs

| Staff tab             | Family view                                                        |
|-----------------------|--------------------------------------------------------------------|
| Projections           | Hidden                                                             |
| Simulation            | Hidden                                                             |
| Live                  | Hidden                                                             |
| Athletes              | Kept: race history, PBs, course bests. No grade/age line from a birth date |
| Meets, Report view    | Hidden (expected times, past range notes)                          |
| Meets, Results view   | Kept: the race table with places, times, mile pace, badges         |
| Records               | Clock-time version only (see open items). The 1.5 mi equivalent list is model output |
| Records, most meets   | Kept                                                               |
| Alumni                | Kept (public results, full names)                                  |
| Method                | Hidden                                                             |
| Course PRs            | Hidden (already admin and coach only)                              |
| This week             | Kept                                                               |

## Data split

Nothing in the family view is private to one runner: every kid's results are visible to every family, and
the model output is left out for all. So one family document is enough, and the per-runner split the
CLAUDE.md note anticipated isn't needed while these decisions hold.

- portals/xc (unchanged): the full data, admin and coach only.
- portals/xc-family (new): written by the pipeline from the same run, with only the fields the family
  view uses. Leave out at the source, not in the page: preds, equiv, equiv_day, reports, sims, live,
  meta.riegel / heat_per_10F / growth_per_year and any other fit parameters, age_known birth data, notes
  written for coaches. Keep: names, gender, active, races (date, meet, race, course, dist, time, place,
  team), schedule (without expected times or "out" flags), records by clock time, alumni.
- members/{email}: add runners: [runnerId, ...] for family members. Used only to pick the home page,
  not for security, since the family document holds nothing runner-private.

The pipeline should write a field allowlist for portals/xc-family rather than a blocklist, so a new model
field never leaks by default. A test in the pipeline: load the family JSON and fail if any key outside the
allowlist appears.

Runner ids must stay stable across pipeline rebuilds, or a family's runners list goes stale. Check how
the pipeline assigns D.runners[].id before building.

## Rules

```
function isFamily() { return isMember() && role() == 'family'; }

match /portals/{portal} {
  allow read: if seesAll() || (isFamily() && portal == 'xc-family');
  match /chunks/{chunk} {
    allow read: if seesAll() || (isFamily() && portal == 'xc-family');
  }
}
```

members create/update: allow role 'family', and the key 'runners' (a list of strings) only when the role
is 'family'.

Coaches and admins can also read xc-family, which lets them preview the family view (a "View as family"
switch in the footer).

## Gate (src/gate.js)

- Portal key by role: family reads 'xc-family', everyone else 'xc'. IndexedDB key follows the portal key,
  so a coach who signs out and a parent who signs in on the same device don't share a cached copy.
- window.DH_ROLE = 'family' and window.DH_RUNNERS = runners, read by the template to pick tabs and the
  home page.
- Role changes (coach to family or back) must drop the saved copy and reload, same as a removed member.

## Template

One template, family mode chosen at runtime by DH_ROLE. The family data simply has no D.reports, D.sims
or D.live, and the template already hides those tabs when the data is missing. The rest needs explicit
checks: Projections, Method, the Report view, the equivalent records list and the expected-time lines on
athlete pages. The claude.ai build stays staff only.

## Open items

1. Records for families: rank by clock time per course and distance (closest to official club records),
   or show only the "most meets" list in v1? Recommendation: per course and distance, top 10 per gender.
2. Track: same plan for portals/track-family, or XC first? Recommendation: XC first, track before the
   spring season.
3. Grade line on athlete pages: keep the grade from meet listings (public) and drop the age from birth
   dates (club data)? Recommendation: yes.
4. How many families, and do both parents get accounts? Affects whether the Members panel needs search
   or a bulk add.

## Test plan (per CLAUDE.md)

- Real SDK in WebKit, desktop and iPhone: sign-in card, no page errors.
- Stub Firebase with real family chunks: first visit, return visit, newer version, removed member,
  role change family to coach and back, stalled connection.
- Live rules: a family account reading portals/xc is denied, reading portals/xc-family is allowed, and an
  unauthenticated read of either is denied.
- Pipeline: the family JSON contains no key outside the allowlist.
