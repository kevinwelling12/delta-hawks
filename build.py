"""Build the signed-in web portals into dist/ (no athlete data inside; it loads from Firestore after sign-in).

  python3 build.py              # dist/index.html (cross country) and dist/track.html
  python3 build.py --emulator   # same, pointed at the local Firebase emulators (demo project), for testing

The templates in templates/ are shared with the claude.ai build (../delta-hawks/scripts/build_portal.py)."""
import pathlib, re, sys
root = pathlib.Path(__file__).resolve().parent
FIREBASE_SDK = '10.12.2'
XC_URL, TRACK_URL = 'https://claude.ai/artifact/9ec7RgWJduQruEPNtHDL6S', 'https://claude.ai/artifact/NJZoGtcinARPJcTtTse9UE'
emu = '--emulator' in sys.argv
src = lambda f: (root / 'src' / f).read_text()

cfg = ("window.FIREBASE_CONFIG={apiKey:'demo',authDomain:'demo-delta-hawks.firebaseapp.com',projectId:'demo-delta-hawks'};window.DH_EMULATOR=true;"
       if emu else src('firebase-config.js'))
sdk = ''.join(f'<script src="https://www.gstatic.com/firebasejs/{FIREBASE_SDK}/firebase-{m}-compat.js"></script>\n' for m in ('app', 'auth', 'firestore'))

NAMES = {'xc': 'Hawks XC', 'track': 'Hawks Track'}   # label under the home screen icon (the page title is too long)
def build(template, key, out):
    html = (root / 'templates' / template).read_text()
    html = html.replace('<script id="data" type="application/json">__DATA__</script>', '<script id="data" type="application/json"></script>')
    assert '__DATA__' not in html, template
    # the portal's own script waits until the gate has loaded the data
    n = 0
    def defer(m):
        nonlocal n
        if "getElementById('data')" in m.group(2): n += 1; return '<script type="text/x-dh-app">' + m.group(2) + '</script>'
        return m.group(0)
    html = re.sub(r'<script(\s*)>([\s\S]*?)</script>', lambda m: defer(m), html)
    assert n == 1, (template, n)
    # links between the two portals stay on this site
    html = (html.replace(f'href="{XC_URL}" target="_blank" rel="noopener"', 'href="./"').replace(f'href="{TRACK_URL}" target="_blank" rel="noopener"', 'href="track.html"')
                .replace(XC_URL, './').replace(TRACK_URL, 'track.html'))
    head = ('<meta name="robots" content="noindex,nofollow">\n'
            + '<link rel="apple-touch-icon" href="apple-touch-icon.png">\n<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">\n'
            + f'<meta name="apple-mobile-web-app-title" content="{NAMES[key]}">\n<style>' + src('gate.css') + '</style>\n' + sdk
            + '<script>' + cfg + f'\nwindow.DH_PORTAL={key!r};</script>\n')
    at = html.find('</head>') if '</head>' in html else html.find('<body')   # the track template has no </head>
    assert at > 0, template
    html = html[:at] + head + html[at:]
    html = re.sub(r'(<body[^>]*>)', lambda m: m.group(1) + '\n' + src('gate.html'), html, count=1)
    html = html.replace('</body>', '<script>' + src('gate.js') + '</script>\n</body>', 1)
    dest = root / 'dist' / out
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(html)
    print(f'wrote dist/{out} ({len(html):,} bytes)')

import shutil
for f in (root / 'src' / 'static').iterdir():   # icons, served next to the pages
    (root / 'dist').mkdir(exist_ok=True); shutil.copy(f, root / 'dist' / f.name)
build('portal_template.html', 'xc', 'index.html')
build('track_portal_template.html', 'track', 'track.html')
