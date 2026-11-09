# MeetReport

The meet report: one Hawks meet at a glance for the staff, a table per race.

- Open with one `rep-sum` line in the `lead` style. Then a `.rep-race` per race: `h4` in `race-title`, a meta line, the table, and a `.pk` line for the unofficial team score.
- Result cells (`td.rs`) give seconds against expected in words, with the range verdict under it. Add `.fast` (`good`) or `.slow` (`bad`) only when the time is outside the 80% range; inside stays `ink`.
- Badges go under the name (see ReportBadges). Notes under the name explain a badge ("2nd on the club list").
- On phones hide the Expected column and put "exp 19:22" under the time; the result line carries the range ("inside 18:58 to 19:50", "past 20:41 by 16 s").
- Results past range are for coaches only.
