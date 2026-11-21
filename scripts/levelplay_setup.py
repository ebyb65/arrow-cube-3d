"""Create (or find) Arrow Cube 3D in LevelPlay, make sure it has rewarded,
interstitial and banner ad units, and write their IDs into src/ads.js.
Safe to run again: it reuses what already exists."""
import json, os, re, sys, time, urllib.request, urllib.error

APP_NAME = os.environ.get('LP_APP_NAME', 'Arrow Cube 3D')
BASE = 'https://platform.ironsrc.com'
SECRET = os.environ.get('LEVELPLAY_SECRET_KEY', '').strip()
REFRESH = os.environ.get('LEVELPLAY_REFRESH_TOKEN', '').strip()
if not SECRET or not REFRESH:
    sys.exit('::error::Add the LEVELPLAY_SECRET_KEY and LEVELPLAY_REFRESH_TOKEN repository secrets first.')

def call(method, path, body=None, token=None, headers=None):
    h = {'Accept': 'application/json'}
    if token: h['Authorization'] = 'Bearer ' + token
    if body is not None: h['Content-Type'] = 'application/json'
    h.update(headers or {})
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read().decode()
    except urllib.error.HTTPError as e:
        sys.exit(f'::error::{method} {path} failed with HTTP {e.code}: {e.read().decode()[:500]}')
    try: return json.loads(raw)
    except ValueError: return raw

token = call('GET', '/partners/publisher/auth', headers={'secretkey': SECRET, 'refreshToken': REFRESH})
token = str(token).strip().strip('"')
print('Signed in to LevelPlay.')

def find_app():
    apps = call('GET', '/partners/publisher/applications/v6?platform=Android', token=token)
    for a in apps if isinstance(apps, list) else []:
        if a.get('appName', '').strip().lower() == APP_NAME.lower() and a.get('appStatus', 'active').lower() == 'active':
            return a
    return None

app = find_app()
if app:
    print(f"Found app '{APP_NAME}' ({app['appKey']}).")
else:
    call('POST', '/partners/publisher/applications/v6', token=token,
         body={'appName': APP_NAME, 'platform': 'Android', 'coppa': 0, 'ccpa': 0})
    for _ in range(10):
        time.sleep(3)
        app = find_app()
        if app: break
    if not app: sys.exit('::error::App was created but could not be found afterwards.')
    print(f"Created app '{APP_NAME}' ({app['appKey']}).")
key = app['appKey']

wanted = {
    'rewarded': {'mediationAdUnitName': 'Rewarded', 'adFormat': 'rewarded',
                 'reward': {'rewardItemName': 'Reward', 'rewardAmount': 1}},
    'interstitial': {'mediationAdUnitName': 'Interstitial', 'adFormat': 'interstitial'},
    'banner': {'mediationAdUnitName': 'Banner', 'adFormat': 'banner', 'settings': [{'bannerRefreshRate': 30}]},
}
def units():
    got = call('GET', f'/levelPlay/adUnits/v1/{key}', token=token)
    out = {}
    for u in got if isinstance(got, list) else []:
        f = u.get('adFormat')
        if f in wanted and not u.get('isPaused') and f not in out:
            out[f] = u['mediationAdUnitId']
    return out

have = units()
missing = [wanted[f] for f in wanted if f not in have]
if missing:
    call('POST', f'/levelPlay/adUnits/v1/{key}', token=token, body=missing)
    time.sleep(3)
    have = units()
for f in wanted:
    if f not in have: sys.exit(f'::error::No {f} ad unit after creation.')
print('Ad units:', json.dumps(have))

path = 'src/ads.js'
s = open(path).read()
for field, value in [('appKey', key), ('rewardedId', have['rewarded']),
                     ('interstitialId', have['interstitial']), ('bannerId', have['banner'])]:
    s, n = re.subn(rf"({field}:\s*)'[^']*'", rf"\g<1>'{value}'", s, count=1)
    if n != 1: sys.exit(f'::error::Could not set {field} in {path}')
open(path, 'w').write(s)

with open(os.environ.get('GITHUB_STEP_SUMMARY', '/dev/null'), 'a') as out:
    out.write(f"## LevelPlay: {APP_NAME}\n\n| Item | ID |\n|---|---|\n| App key | `{key}` |\n"
              f"| Rewarded | `{have['rewarded']}` |\n| Interstitial | `{have['interstitial']}` |\n| Banner | `{have['banner']}` |\n")
