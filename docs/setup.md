# Setup: invite-only web portals (about 20 minutes, all free)

The code is done. These are the one-time account steps only you can do. Same pattern as the football
suite, plus a service account key so your Mac can upload the data.

## 1. Firebase project
1. https://console.firebase.google.com > **Create a project**, name it `delta-hawks`
   (a new project, not football-suite, so the member lists stay separate). Google Analytics: off.
   Plan: Spark (free).
2. **Build > Authentication > Get started > Sign-in method > Google > Enable**, pick your support
   email, Save.
3. **Build > Firestore Database > Create database**. Location `us-west2 (Los Angeles)`.
   Start in **production mode**.
4. Firestore > **Rules** tab: replace everything with the contents of `firestore.rules`, **Publish**.
5. **Project settings (gear) > General > Your apps > Web (</>)**. Nickname "web", no Hosting,
   Register. Copy the `firebaseConfig` object into `src/firebase-config.js` as
   `window.FIREBASE_CONFIG = { ... };`. These values are not secret; the rules protect the data.
6. **Project settings > Service accounts > Generate new private key**. Save the downloaded file as
   `~/.config/delta-hawks/firebase-admin.json` (in Terminal: `mkdir -p ~/.config/delta-hawks`, then
   move the file there and rename it). This key IS secret: it can write anything. Keep it out of
   iCloud, the repo, email and chat.

## 2. GitHub Pages
1. Create a GitHub repo (e.g. `delta-hawks`). Public is fine: this repo holds only the app code.
   Athlete data never goes in it (the .gitignore blocks .json and .csv files as a backstop).
2. Push this `web/` folder to `main`.
3. Repo **Settings > Pages > Build and deployment > Source: GitHub Actions**.
4. The site will be at `https://<your-username>.github.io/<repo-name>/` (cross country) and
   `.../track.html`.

## 3. Allow the site to sign in
Firebase console > **Authentication > Settings > Authorized domains > Add domain**:
`<your-username>.github.io`

## 4. First run (from the pipeline folder, delta-hawks/)
    python3 scripts/publish_web.py --add you@gmail.com admin "Kevin"
    python3 scripts/publish_web.py                 # uploads both portals
Open the site, sign in with Google. Add your wife and coaches from **Members** in the footer
(or with `--add EMAIL coach "Name"`), then send them the link.

## Day to day
- New results: `python3 scripts/update.py raw/<file>.csv --web` (reruns the model, rebuilds the
  claude.ai file, uploads to the web site). Track: run `track_model.py` first, then
  `publish_web.py`. Viewers get the new data on their next visit.
- Design changes: edit `templates/`, push. GitHub rebuilds the site.

## Troubleshooting
- "auth/unauthorized-domain": step 3 missing or a typo in the domain.
- "Not on the list yet": the email they signed in with doesn't match the invite. Google account
  emails are compared in lowercase.
- "No results have been published yet": run `publish_web.py`.
- Removing someone takes effect on their next visit: they see "Not on the list yet" and the copy cached
  in their browser is deleted. Anything they already screenshotted or saved can't be recalled.
