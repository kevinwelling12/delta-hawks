# Select

Native select and time input, 42px tall with a `ctl` border and `radius-md`.

- Put a `sub` label before the control in a `.bar`. 16px text so iOS does not zoom.
- The select draws its own grey chevron (an inline SVG background); keep `appearance: none`.
- `input.tin` holds a time (`mm:ss`), tabular figures, 6.5em wide. Mark a bad value with `aria-invalid="true"` for the `bad` border.
