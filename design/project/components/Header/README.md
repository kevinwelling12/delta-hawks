# Header

The charcoal band at the top of every portal: club mark, tracked yellow wordmark, tagline and sport switcher.

- Use once per page, first in the body. Background `head`, wordmark `hawk` in the `wordmark` style, tagline `band-muted`.
- The consumer supplies the mark image (66 to 88px tall), the tagline text and the sport links. The current sport is a `span` with `aria-current="page"` filled in `hawk`; the other is a link.
- In an embedded (framed) view, hide the h1 with `.framed` on an ancestor.
- Never place the white mark anywhere but on `head`.
