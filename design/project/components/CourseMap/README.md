# CourseMap

A collapsed Course maps section under a meet's line on the Projections tab: one course at a time, with a map and an elevation profile.

- `details.cmw`, max width `map-max`. Chips pick the course, with the age groups in a `small`. A `sub` line gives length, climb and high point; a source note ends it.
- The SVGs come from the pipeline with `cm-*` classes. The route is `map-route` on a `map-case` edge in both themes; ground `panel`, water `map-water`, trails and roads `muted`, labels `ink` with a `panel` halo.
- The profile is a `map-route` area at 40% under a 2px `ink` line, `line` grid.
