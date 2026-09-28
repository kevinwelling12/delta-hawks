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
- Test: there is no Java on the Mac, so the Firestore emulator is not set up; the gate was tested with
  a stub Firebase serving real chunks. Check the live rules after any change: an unauthenticated read
  of portals/xc must be denied.
- Kevin prefers plain, direct writing: no em dashes, no filler.
