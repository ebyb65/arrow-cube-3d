"""Read-only Google Play API check: signs in with the service account and lists
each app's tracks and releases. Opens a temporary edit and deletes it (no changes)."""
import json, os, sys
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

raw = os.environ.get('PLAY_SERVICE_ACCOUNT_JSON', '').strip()
if not raw:
    sys.exit('::error::Secret PLAY_SERVICE_ACCOUNT_JSON is missing in this repo.')
try:
    info = json.loads(raw)
except ValueError:
    sys.exit('::error::PLAY_SERVICE_ACCOUNT_JSON is not valid JSON (was the whole file pasted?).')
print('Service account:', info.get('client_email'))
creds = service_account.Credentials.from_service_account_info(info, scopes=['https://www.googleapis.com/auth/androidpublisher'])
s = AuthorizedSession(creds)
base = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications'
summary = ['## Google Play API check', '']
ok = True
for pkg in os.environ['PACKAGES'].split(','):
    r = s.post(f'{base}/{pkg}/edits', json={})
    if r.status_code != 200:
        ok = False
        msg = r.json().get('error', {}).get('message', r.text[:200]) if r.headers.get('content-type','').startswith('application/json') else r.text[:200]
        print(f'{pkg}: FAILED {r.status_code}: {msg}')
        summary.append(f'- **{pkg}**: failed ({r.status_code}): {msg}')
        continue
    eid = r.json()['id']
    tracks = s.get(f'{base}/{pkg}/edits/{eid}/tracks').json().get('tracks', [])
    s.delete(f'{base}/{pkg}/edits/{eid}')
    summary.append(f'- **{pkg}**: access OK')
    for t in tracks:
        rel = '; '.join(f"{x.get('name','')} {x.get('versionCodes',[])} {x.get('status','')}" for x in t.get('releases', [])) or 'no releases'
        print(f"{pkg} [{t['track']}]: {rel}")
        summary.append(f"  - {t['track']}: {rel}")
with open(os.environ.get('GITHUB_STEP_SUMMARY', '/dev/null'), 'a') as f:
    f.write('\n'.join(summary) + '\n')
if not ok:
    sys.exit(1)
