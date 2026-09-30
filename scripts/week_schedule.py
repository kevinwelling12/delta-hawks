"""This week's practice schedule, read from the club blog (deltahawksracing.org/blog, a public Wix blog).

Most posts end with a block like:
    This week's schedule is as follows:
    MONDAY – 5:30pm
    All Hawks in West Sacramento
    5-6 x 800m at Lock Hills
    TUESDAY
    Stretch and Recover
    ...
    Any questions, let us know!
    Coach Eric

The RSS feed only carries the first ~500 characters of each post, so this reads the feed for the post links and
dates, then opens posts newest first until one has a schedule.

  python3 scripts/week_schedule.py            # print the parsed schedule as JSON
"""
import datetime, html, json, re, sys, urllib.request, xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from zoneinfo import ZoneInfo

FEED = 'https://www.deltahawksracing.org/blog-feed.xml'
PT = ZoneInfo('America/Los_Angeles')
DAY = r'(?:MON|TUES|WEDNES|THURS|FRI|SATUR|SUN)DAY'
HEAD = re.compile(rf'^({DAY}(?:\s*(?:or|and|&|/)\s*{DAY})?)\s*(?:[–—-]\s*(.*))?$', re.I)   # "MONDAY – 5:30pm", "SATURDAY or SUNDAY"
END = re.compile(r'^(any questions|recent posts|see all)\b', re.I)

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Delta Hawks portal; weekly schedule)'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode('utf-8', 'replace')

def lines_of(page):
    t = re.sub(r'<(script|style)[\s\S]*?</\1>', '', page)
    t = re.sub(r'<(br|/p|/div|/li|/h\d|/section|/tr)\b[^>]*>', '\n', t, flags=re.I)   # new lines only at block ends:
    t = html.unescape(re.sub(r'<[^>]+>', '', t))                                        # bold or linked words stay in their line
    return [l for l in (re.sub(r'[ \t\xa0]+', ' ', x).strip() for x in t.split('\n')) if l]

def parse(lines):
    """The schedule block in a post's text lines: [{'day', 'time', 'items'}], or None."""
    intro = next((i for i, l in enumerate(lines) if re.search(r'schedule (is|for)\b.*:?\s*$', l, re.I) and len(l) < 80), -1)
    start = next((i for i, l in enumerate(lines) if i > intro and HEAD.match(l)), None)
    if start is None:
        return None
    days, sign = [], None
    for i in range(start, len(lines)):
        l = lines[i]
        if END.match(l):
            nxt = lines[i + 1] if i + 1 < len(lines) else ''
            sign = nxt if re.match(r'^Coach\b', nxt) else None
            break
        m = HEAD.match(l)
        if m:
            days.append({'day': m.group(1).title().replace(' Or ', ' or ').replace(' And ', ' and '), 'time': (m.group(2) or '').strip(), 'items': []})
        elif days:
            days[-1]['items'].append(l.rstrip(' -–'))
    days = [d for d in days if d['items'] or d['time']]
    return (days, sign) if len(days) >= 3 else None      # a real week names at least three days

def week_of(posted):
    """The Monday the schedule is for: a weekend post is for the coming week, a weekday post for the current one."""
    d = posted.astimezone(PT).date()
    return d + datetime.timedelta(days=(7 - d.weekday()) % 7) if d.weekday() >= 5 else d - datetime.timedelta(days=d.weekday())

def latest(max_posts=6):
    root = ET.fromstring(get(FEED))
    for item in root.findall('.//item')[:max_posts]:
        link, title = item.findtext('link'), item.findtext('title')
        posted = parsedate_to_datetime(item.findtext('pubDate'))
        got = parse(lines_of(get(link)))
        if got:
            days, sign = got
            return {'title': title, 'link': link, 'posted': posted.astimezone(PT).date().isoformat(),
                    'week_of': week_of(posted).isoformat(), 'by': sign, 'days': days}
    return None

if __name__ == '__main__':
    json.dump(latest(), sys.stdout, indent=1, ensure_ascii=False)
    print()
