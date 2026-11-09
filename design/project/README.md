The Delta Hawks results portals (cross-country and track) for a youth running club. Coaches and admins open them on phones at meets and on laptops at home. Every screen answers one question: how fast will this runner go, and how did they do. Build anything new for the club from these rules.

## Content

- Write plain and direct. Short sentences, active voice, no filler, no em dashes. "Expected at", "Hawks only", "Not on the list", "Marked as not going", "Then send them the link. There is no automatic invite email."
- Address the reader only when they have to act: "Please try again." Otherwise describe the data.
- Labels are nouns people already use at a meet: Projections, Athletes, Meets, Records, Alumni, Method, Simulation, This week. Girls and Boys, never F and M on screen.
- Times are the content. Write them as a runner reads a watch: `17:42`, `5:38.4`. Mile pace sits under a time as `5:38/mi`.
- Results read in seconds against expected: "14 s faster", "right on it", "49 s slower". The range line under it says "inside range", "ahead of range by 6 s" or "past range by 16 s". On phones: "exp 7:47" and "inside 6:42 to 9:02".
- Ranges are "8 in 10" or "likely (80%)". Team scores are labelled unofficial.
- Names in lists: first name and last initial when the view is shared beyond coaches.
- Error text names what failed and what to do: the sign-in card shows the error code and the step that stalled.
- No emoji, no exclamation marks, no marketing words.

## Colour

- Hawk yellow (`hawk`) is the club. Charcoal (`head`, `ink`) carries it. Everything else is grey.
- The header is always a charcoal `head` band with the wordmark in `hawk`, tagline in `band-muted`, tabs in `band-tab` turning `band-ink` with a 3px `hawk` underline when selected.
- Below the band the page is `bg` with `ink` text and `muted` secondary text. Use `panel` only for hover, group rows, venue rows, notes, tiles and the simulation bar.
- Selection flips between themes: `sel-bg` is charcoal with yellow `sel-fg` in light, yellow with charcoal text in dark. Use these for selected chips, the primary button and PR/PB badges, never `hawk` directly.
- Never put text in `hawk` on `bg`. Yellow on white is unreadable. Yellow text belongs on `head`, `sel-bg` or `map-case`.
- Anything drawn on yellow (range-band markers, record badge text, best simulation segment) is `hawk-ink`, in both themes.
- A Hawks row in another team's results table gets `hawk-row` fill, weight 600 and a 4px inset `mark` edge on its first cell.
- `good` and `bad` mark results outside the likely range only: faster in `good`, slower in `bad`. Inside the range stays `ink`. Always pair the colour with words ("14 s faster"). Results past range are for coaches: hide them from any family view.
- `faint` is for outlines of minor badges and retired PRs only.
- Course maps keep a fixed palette in both themes: `map-route` yellow on a `map-case` edge, `map-water` water, trails and labels from `muted` and `ink`.

## Type

- Two families. `cond` (Barlow Condensed) for anything that is a label, title or number. `body` (Figtree) for sentences and names.
- Condensed labels are uppercase with tracking: `wordmark` 0.2em, `tagline` 0.14em, `tab` 0.06em, `control` 0.04em, `badge` and `report-badge` 0.06em. Section and race titles stay sentence case.
- Every number that lines up uses `font-variant-numeric: tabular-nums`: times, ranks, places, tables, figures.
- The athlete page leads with `time-hero`: the expected time at up to 120px, line height 0.86. The time is the page.
- Body copy is `body` at 15px/1.5. The meet report opens with one `lead` line. Secondary lines are `sub` (14px), `meta` (13px) or `caption` (12px) in `muted`. Keep prose to 68ch.

## Layout

- One column, `content-max` 1000px, side gutter `pad` (16px, `pad-wide` 20px from 720px).
- The tab bar sticks to the top of the screen under the safe-area inset. Tabs scroll sideways on phones with no scrollbar. The track portal fades the right edge while tabs are hidden.
- Separate with hairlines, not boxes. Rows, lists and tables get 1px `line` rules above and below. On phones they bleed to the screen edge so more columns fit. From 720px they sit inside the gutter with an 8px inset.
- Stat figures sit under a 3px `hawk` rule, never in a card.
- Wide tables scroll inside `.scroll`, with a soft shadow on the edge that has more columns. On phones the first column sticks. Prefer folding a column into the cell below (Expected under the time) over sideways scrolling: tables should fit 390px.
- Touch targets are at least 40px tall (chips 40, selects and inputs 42, tabs 48, rows 58). Entry buttons in the Who's going panel are 36px.

## Shape and depth

- Small radii: `radius-sm` for badges and the range band, `radius-md` for controls, tiles and the simulation bar, `radius-lg` for the sport switcher, tooltips, the note callout and course maps.
- The only shadows are `shadow-tip` on chart tooltips and `shadow-pill` on the pull-to-refresh pill. Overlay panels sit on a 55% black scrim.
- The note callout is a `panel` block with a 3px `hawk` left edge and `radius-lg` on the right corners. It is the one place a coloured edge appears on a block.

## States

- Focus: a 3px solid `focus` ring with 2px offset. On the head band and tabs the ring is `hawk`, drawn inset.
- Hover on controls darkens the border to `ink`. Hover on roster rows fills `panel`.
- Pressed chips use `aria-pressed="true"` and the `sel-bg`/`sel-fg` pair. In Who's going, a pressed No fills `muted`; a second tap clears.
- "Loading..." appears only after 600 ms. A return visit opens from the saved copy at once.
- Motion is limited to the pull-to-refresh pill and its spinner. Respect `prefers-reduced-motion`.

## Iconography and imagery

- No icon set. Controls are words, and status is a badge with a word. The select chevron is a small inline SVG stroke in grey (`#898B90`).
- The club mark (white wings, yellow talons, white type) sits only on the charcoal `head` band, 66 to 88px tall, left of the wordmark with a `band-rule` divider. It is a white single-ink image: never place it on `bg` in light mode.
- The home screen icon is the mark on charcoal.
- No photos. Charts and course maps are the imagery: `hawk` and `delta` series, `line` grid, `mark` emphasis, tooltips on `bg` with `shadow-tip`.

## Components

The cards under Components are static renditions of the portal markup, styled by `components/bundle.css`, which is the portal stylesheet. Use the same class names when you build: `.band .top`, `.tabs`, `.chip`, `select`, `.roster`, `.scroll table`, `.rep-race`, `.rb`, `.rs`, `.kv`, `.note`, `.big` with `.strip`, `.prb`, `.fx`, `.list`, `.simbar`, `.cmw` with `cm-*` SVG classes, `input.tin`. The pages are plain HTML and JavaScript with no component library.
