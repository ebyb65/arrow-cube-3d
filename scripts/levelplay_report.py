"""LevelPlay revenue report: last 7 complete days vs the 7 days before.

Per app and ad format: revenue, impressions, eCPM. Per app: average daily
active users (LevelPlay's activeUsers). Writes a Markdown table to the GitHub
job summary (GITHUB_STEP_SUMMARY) and to stdout, and saves raw numbers to
levelplay_report.json.

API: GET https://platform.ironsrc.com/levelPlay/reporting/v1 (Bearer token from
/partners/publisher/auth). Docs: docs.unity.com/en-us/grow/levelplay/platform/api/reporting
"""
import datetime as dt, json, os, sys, urllib.parse, urllib.request, urllib.error

BASE = 'https://platform.ironsrc.com'
SECRET = os.environ.get('LEVELPLAY_SECRET_KEY', '').strip()
REFRESH = os.environ.get('LEVELPLAY_REFRESH_TOKEN', '').strip()
if not SECRET or not REFRESH:
    sys.exit('::error::Add the LEVELPLAY_SECRET_KEY and LEVELPLAY_REFRESH_TOKEN repository secrets first.')

def call(path, token=None, headers=None):
    h = {'Accept': 'application/json'}
    if token: h['Authorization'] = 'Bearer ' + token
    h.update(headers or {})
    req = urllib.request.Request(BASE + path, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            raw = r.read().decode()
    except urllib.error.HTTPError as e:
        sys.exit(f'::error::GET {path.split("?")[0]} failed with HTTP {e.code}: {e.read().decode()[:500]}')
    try: return json.loads(raw)
    except ValueError: return raw

token = str(call('/partners/publisher/auth', headers={'secretkey': SECRET, 'refreshToken': REFRESH})).strip().strip('"')
print('Signed in to LevelPlay.')

# Names of the apps on the account (appKey -> name), so rows read nicely.
names = {}
apps = call('/partners/publisher/applications/v6', token=token)
for a in apps if isinstance(apps, list) else []:
    if a.get('appKey'): names[a['appKey']] = a.get('appName') or a['appKey']

today = dt.date.today()
cur_end = today - dt.timedelta(days=1)          # yesterday (last complete UTC day)
cur_start = cur_end - dt.timedelta(days=6)
prev_end = cur_start - dt.timedelta(days=1)
prev_start = prev_end - dt.timedelta(days=6)

def report(metrics, breakdowns):
    rows, page = [], 1
    while True:
        q = urllib.parse.urlencode({'startDate': prev_start.isoformat(), 'endDate': cur_end.isoformat(),
                                    'metrics': metrics, 'breakdowns': breakdowns,
                                    'page': page, 'resultsPerPage': 5000})
        got = call('/levelPlay/reporting/v1?' + q, token=token)
        if not isinstance(got, dict):
            sys.exit(f'::error::Unexpected reporting response: {str(got)[:300]}')
        data = got.get('data') or []
        rows += data
        total = got.get('totalResults') or 0
        if not data or len(rows) >= total: break
        page += 1
    return rows

def app_of(r):
    for k in ('appKey', 'app', 'appName'):
        if r.get(k): return names.get(r[k], r[k])
    return '(unknown app)'

def period(d):
    d = dt.date.fromisoformat(str(d)[:10])
    return 'cur' if d >= cur_start else 'prev'

num = lambda v: float(v or 0)

fmt_rows = report('revenue,impressions', 'date,app,adFormat')
if fmt_rows: print('Sample row:', json.dumps(fmt_rows[0]))
by = {}
for r in fmt_rows:
    key = (app_of(r), str(r.get('adFormat') or '?').lower())
    p = by.setdefault(key, {'cur': [0.0, 0.0], 'prev': [0.0, 0.0]})[period(r['date'])]
    p[0] += num(r.get('revenue')); p[1] += num(r.get('impressions'))

dau_rows = report('activeUsers', 'date,app')
dau = {}
for r in dau_rows:
    d = dau.setdefault(app_of(r), {'cur': [], 'prev': []})
    d[period(r['date'])].append(num(r.get('activeUsers')))

def ecpm(rev, imp): return rev / imp * 1000 if imp else 0.0
def chg(a, b):
    if not b: return 'new' if a else '–'
    return f'{(a - b) / b * 100:+.0f}%'
avg = lambda xs: sum(xs) / 7 if xs else 0.0   # days with no row count as 0

out = [f'## LevelPlay report: {cur_start} to {cur_end} vs {prev_start} to {prev_end}', '',
       'Revenue in USD as reported by LevelPlay. eCPM = revenue / impressions x 1000.', '']
if not fmt_rows and not dau_rows:
    out.append('**No LevelPlay data in these 14 days** (no impressions or active users reported for any app).')
else:
    out += ['| App | Ad format | Revenue (7d) | prev 7d | change | Impressions | prev | eCPM | prev eCPM |',
            '|---|---|---:|---:|---:|---:|---:|---:|---:|']
    totals = {}
    for (app, f), v in sorted(by.items()):
        (cr, ci), (pr, pi) = v['cur'], v['prev']
        t = totals.setdefault(app, [0, 0, 0, 0]); t[0] += cr; t[1] += ci; t[2] += pr; t[3] += pi
        out.append(f'| {app} | {f} | ${cr:.2f} | ${pr:.2f} | {chg(cr, pr)} | {ci:.0f} | {pi:.0f} | ${ecpm(cr, ci):.2f} | ${ecpm(pr, pi):.2f} |')
    for app, (cr, ci, pr, pi) in sorted(totals.items()):
        out.append(f'| **{app}** | **all** | **${cr:.2f}** | **${pr:.2f}** | {chg(cr, pr)} | {ci:.0f} | {pi:.0f} | ${ecpm(cr, ci):.2f} | ${ecpm(pr, pi):.2f} |')
    out += ['', '| App | Avg daily active users (7d) | prev 7d | change |', '|---|---:|---:|---:|']
    for app, d in sorted(dau.items()):
        a, b = avg(d['cur']), avg(d['prev'])
        out.append(f'| {app} | {a:.1f} | {b:.1f} | {chg(a, b)} |')
    known = {a for a, _ in by} | set(dau)
    quiet = sorted(set(names.values()) - known)
    if quiet: out += ['', 'Apps on the account with no data in these 14 days: ' + ', '.join(quiet)]

text = '\n'.join(out) + '\n'
print(text)
if os.environ.get('GITHUB_STEP_SUMMARY'):
    open(os.environ['GITHUB_STEP_SUMMARY'], 'a').write(text)
json.dump({'current': [str(cur_start), str(cur_end)], 'previous': [str(prev_start), str(prev_end)],
           'apps': names, 'byFormat': [{'app': a, 'adFormat': f, **v} for (a, f), v in by.items()],
           'activeUsers': dau}, open('levelplay_report.json', 'w'), indent=1)
