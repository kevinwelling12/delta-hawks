# Delta Hawks design system: source files

The source of the Delta Hawks design system on claude.ai
(https://claude.ai/artifact/7JZzk8ZonVm5u6LUmUKtXx). Keep this folder in step with that artifact, so the
system can be rebuilt if the artifact is lost again (the first one was deleted in November 2026).

- `project/` holds the files exactly as published, at the paths the artifact serves them under:
  `design-system.json` (the index), `tokens.json`, `README.md` (the brand book), `components/bundle.css`
  (the portal stylesheet from templates/portal_template.html, with the colour tokens taken out) and one folder
  per component with `README.md` and `preview.html`. `components/Cover/preview.html` is the cover.
- Athletes and meets in the previews are made up. Never put real athlete names or results here.
- The logos are not copied here. They are uploads in the artifact's asset store, named by blob id in
  `design-system.json`. Their sources: the header mark is the inline webp in templates/portal_template.html,
  the icons are src/static/apple-touch-icon.png and src/static/favicon-32.png.

## Rebuild

Ask Claude Code to rebuild the design system from `design/project`:

1. Create a new artifact from the Design System type, titled "Delta Hawks Design System".
2. Upload the three logo files to it as assets and put the new blob ids in `design-system.json`
   (`assetGroups.Logos.files`) and in `components/Header/preview.html`.
3. Publish every file under `project/` in one call, with `design-system.json` as the main file.
4. Update the link at the top of this file.

## Update

After a change to the templates' colours, type or components, edit the files here, publish the changed
files to the artifact, and commit both together.
