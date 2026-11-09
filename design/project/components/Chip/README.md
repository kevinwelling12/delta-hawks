# Chip

Toggle and action button: a 40px uppercase condensed label with a `ctl` border and `radius-md`.

- Toggles use `aria-pressed`. Pressed fills `sel-bg` with `sel-fg` text; hover darkens border and text to `ink`.
- Group related toggles in `.bar` (8px gap); wrap a pair that must stay on one line in `.pair`.
- `.dh-go` is the primary action (Sign in, Add, Try again): always `sel-bg`.
- One word, two at most. A chip may carry a `small` note in `body` type (course map age groups).
