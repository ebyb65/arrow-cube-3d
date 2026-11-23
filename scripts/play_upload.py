"""Upload a signed AAB to a Google Play TESTING track (internal or closed/alpha).
Never touches production: the script refuses any other track, and the service
account has no production permission anyway. Settings come from ops/upload.json."""
import glob, json, os, sys
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

ALLOWED = {'internal', 'alpha'}
cfg = json.load(open('ops/upload.json'))
pkg, track, notes = cfg['package'], cfg['track'], cfg.get('notes', '')
if track not in ALLOWED:
    sys.exit(f'::error::Track "{track}" refused. Only {sorted(ALLOWED)} are allowed.')
aabs = glob.glob('aab/**/*.aab', recursive=True)
if len(aabs) != 1:
    sys.exit(f'::error::Expected exactly one .aab, found {aabs}')
aab = aabs[0]
print('AAB:', aab, os.path.getsize(aab), 'bytes')

info = json.loads(os.environ['PLAY_SERVICE_ACCOUNT_JSON'])
creds = service_account.Credentials.from_service_account_info(info, scopes=['https://www.googleapis.com/auth/androidpublisher'])
s = AuthorizedSession(creds)
base = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications'
up = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications'

def check(r, what):
    if r.status_code >= 300:
        sys.exit(f'::error::{what} failed {r.status_code}: {r.text[:800]}')
    return r.json() if r.text else {}

eid = check(s.post(f'{base}/{pkg}/edits', json={}), 'Open edit')['id']
try:
    with open(aab, 'rb') as f:
        b = check(s.post(f'{up}/{pkg}/edits/{eid}/bundles?uploadType=media', data=f,
                         headers={'Content-Type': 'application/octet-stream'}, timeout=600), 'Upload bundle')
    vc = b['versionCode']
    print('Uploaded versionCode', vc)
    release = {'versionCodes': [str(vc)], 'status': 'completed', 'name': cfg.get('name', str(vc))}
    if notes:
        release['releaseNotes'] = [{'language': 'en-US', 'text': notes[:500]}]
    check(s.put(f'{base}/{pkg}/edits/{eid}/tracks/{track}', json={'track': track, 'releases': [release]}), 'Update track')
    check(s.post(f'{base}/{pkg}/edits/{eid}:commit'), 'Commit edit')
except SystemExit:
    s.delete(f'{base}/{pkg}/edits/{eid}')
    raise
msg = f'Uploaded {pkg} versionCode {vc} to track "{track}" and sent for review.'
print(msg)
with open(os.environ.get('GITHUB_STEP_SUMMARY', '/dev/null'), 'a') as f:
    f.write(f'## Google Play upload\n\n{msg}\n')
