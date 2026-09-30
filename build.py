"""Build the signed-in web portals into dist/ (no athlete data inside; it loads from Firestore after sign-in).

  python3 build.py              # dist/index.html (cross country) and dist/track.html
  python3 build.py --emulator   # same, pointed at the local Firebase emulators (demo project), for testing

The templates in templates/ are shared with the claude.ai build (../delta-hawks/scripts/build_portal.py)."""
import pathlib, re, sys
root = pathlib.Path(__file__).resolve().parent
FIREBASE_SDK = '10.12.2'
XC_URL, TRACK_URL = 'https://claude.ai/artifact/Kf7MfZowHdKM2tPsAEfgRH', 'https://claude.ai/artifact/SPA2xn2XM8rqnVsvLGBsqs'
emu = '--emulator' in sys.argv
src = lambda f: (root / 'src' / f).read_text()

cfg = ("window.FIREBASE_CONFIG={apiKey:'demo',authDomain:'demo-delta-hawks.firebaseapp.com',projectId:'demo-delta-hawks'};window.DH_EMULATOR=true;"
       if emu else src('firebase-config.js'))
sdk = ''.join(f'<script src="https://www.gstatic.com/firebasejs/{FIREBASE_SDK}/firebase-{m}-compat.js"></script>\n' for m in ('app', 'auth', 'firestore'))

import datetime, os, subprocess
def _sha():
    try: return os.environ.get('GITHUB_SHA') or subprocess.run(['git', 'rev-parse', 'HEAD'], capture_output=True, text=True, cwd=root).stdout.strip()
    except Exception: return ''
# version stamp shown in the footer, in Pacific time: helps tell whether an update has reached a device
from zoneinfo import ZoneInfo
_pt = datetime.datetime.now(ZoneInfo('America/Los_Angeles'))
BUILD = _pt.strftime('%b %-d, %-I:%M %p').replace('AM', 'am').replace('PM', 'pm') + (' · ' + _sha()[:7] if _sha() else '')
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
    head = (f'<script>window.DH_BUILD={BUILD!r};</script>\n' + '<meta name="robots" content="noindex,nofollow">\n'
            + '<link rel="apple-touch-icon" href="apple-touch-icon.png">\n<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">\n'
            + f'<meta name="apple-mobile-web-app-title" content="{NAMES[key]}">\n<style>' + src('gate.css') + '</style>\n' + sdk
            + '<script>' + cfg + f'\nwindow.DH_PORTAL={key!r};</script>\n')
    at = html.find('</head>') if '</head>' in html else html.find('<body')   # the track template has no </head>
    assert at > 0, template
    html = html[:at] + head + html[at:]
    html = week_tab(html)
    html = re.sub(r'(<body[^>]*>)', lambda m: m.group(1) + '\n' + src('gate.html'), html, count=1)
    html = html.replace('</body>', '<script>' + src('gate.js') + '</script>\n</body>', 1)
    dest = root / 'dist' / out
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(html)
    print(f'wrote dist/{out} ({len(html):,} bytes)')

# "This week" tab: the practice schedule from the latest club blog post (scripts/week_schedule.py). The Pages workflow
# rebuilds every few hours so a new post shows up on its own. If the blog can't be read, the pages build without the tab.
def week_schedule():
    if '--no-schedule' in sys.argv: return None
    try:
        sys.path.insert(0, str(root / 'scripts')); import week_schedule as ws
        return ws.latest()
    except Exception as e:
        print(f'schedule: skipped ({e})'); return None
WEEK = week_schedule()
def week_tab(html):
    if not WEEK: return html
    from html import escape as e
    wk = datetime.date.fromisoformat(WEEK['week_of'])
    md = lambda d: d.strftime('%b %-d')
    def when(t):
        m = re.fullmatch(r'(\d{1,2}(?::\d\d)?)\s*([ap]\.?m\.?)', t.strip(), re.I)
        return f'{e(m.group(1))}<small>{e(m.group(2).replace(".", "").lower())}</small>' if m else e(t)
    rows = ''.join(f'<li data-day="{e(d["day"])}"><span class="ln">{e(d["day"])}</span>'
                   + ''.join(f'<span class="lm">{e(i)}</span>' for i in d['items'])
                   + (f'<span class="lt">{when(d["time"])}</span>' if d['time'] else '') + '</li>' for d in WEEK['days'])
    by = f' by {e(WEEK["by"])}' if WEEK.get('by') else ''
    section = (f'<section id="week" role="tabpanel" data-week="{wk.isoformat()}">\n <h2>Week of {md(wk)}</h2>\n'
               f' <p class="sub">Practice schedule from <a href="{e(WEEK["link"])}" target="_blank" rel="noopener">{e(WEEK["title"])}</a>, '
               f'posted {md(datetime.date.fromisoformat(WEEK["posted"]))}{by}. Check the post and TeamSnap for changes.</p>\n'
               f' <p class="note" id="weekOld" hidden>No schedule has been posted for this week yet. This is the latest one.</p>\n'
               f' <ul class="list" id="weekList">{rows}</ul>\n</section>\n')
    # today's row stands out; a schedule more than a week old says so
    script = ("<style>#weekList li.today{background:var(--hawk-row)}#weekList li.today .ln::after{content:' · Today';font-weight:500;color:var(--muted)}</style>"
              "<script>(function(){try{const s=document.getElementById('week'),pt=new Date(new Date().toLocaleString('en-US',{timeZone:'America/Los_Angeles'})),"
              "w=new Date(s.dataset.week+'T00:00:00'),d=Math.floor((pt-w)/864e5),name=pt.toLocaleDateString('en-US',{weekday:'long'});"
              "if(d>6)document.getElementById('weekOld').hidden=false;else if(d>=0)s.querySelectorAll('li').forEach(li=>{if(li.dataset.day.split(/ (?:or|and) /).includes(name))li.classList.add('today')})}catch(e){}})();</script>\n")
    tab = '<button role="tab" aria-selected="false" data-tab="week">This week</button>'
    first = re.search(r'<button role="tab" aria-selected="true" data-tab="roster">[^<]*</button>', html)
    at = html.find('<section id="model"')
    assert first and at > 0, 'tab bar or Method section not found'
    html = html[:first.end()] + '\n ' + tab + html[first.end():]
    at = html.find('<section id="model"')
    return html[:at] + section + script + html[at:]

import shutil
for f in (root / 'src' / 'static').iterdir():   # icons, served next to the pages
    (root / 'dist').mkdir(exist_ok=True); shutil.copy(f, root / 'dist' / f.name)
build('portal_template.html', 'xc', 'index.html')
build('track_portal_template.html', 'track', 'track.html')
