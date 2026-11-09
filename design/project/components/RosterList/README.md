# RosterList

The projections list: one full-width button per athlete, name and meta on the left, expected time on the right.

- `.roster` of `li > button`. Add `.ranked` when order is a ranking, with `.rk` first. `.rn` name, `.rm` meta, `.rt` the time in the `figure` style with the 8 in 10 range in `small`.
- Group by race with `li.grp` holding an h3, in the meet's race order. Athletes marked as not going come last, unranked.
- Rows bleed to the screen edge on phones, 58px minimum, `line` hairlines, `panel` on hover. Tapping opens the athlete.
- Show `.empty` with a sentence when the filter leaves nothing.
