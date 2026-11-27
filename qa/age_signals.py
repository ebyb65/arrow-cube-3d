# Arjun QA (age-api). Usage: npm run build; python3 -I qa/age_signals.py "$PWD/dist" /tmp/shots
# Fakes the native Capacitor bridge (LevelPlay + PlayAgeSignals) in Chromium and checks which privacy
# flags reach LevelPlay.initialize() for each Play Age Signals answer, and that the game still plays.
import sys, os, json
from playwright.sync_api import sync_playwright
DIST, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
URL = 'file://' + DIST + '/index.html'

FAKE = """
(() => {
  const AGE = %s;            // what the fake Play returns (or 'throw' / 'hang' / 'missing')
  window.__calls = []; window.__ageCalls = 0;
  const noop = async () => ({});
  const LevelPlay = new Proxy({
    addListener: async () => ({ remove() {} }),
    initialize: async (o) => { window.__calls.push(['initialize', o]); return {}; },
    isReady: async () => ({ ready: false }),
    createBanner: async () => ({ frame: { height: 50 } }),
    showBanner: async () => ({ frame: { height: 50 } }),
  }, { get: (t, k) => (k in t ? t[k] : noop) });
  const plugins = { LevelPlay };
  if (AGE !== 'missing') plugins.PlayAgeSignals = {
    check: () => { window.__ageCalls++;
      if (AGE === 'throw') return Promise.reject(new Error('boom'));
      if (AGE === 'hang') return new Promise(() => {});
      return Promise.resolve(AGE); },
  };
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android', Plugins: plugins };
})();
"""

CASES = [
  # name, Play answer, expected group, expect coppa+doNotSell
  ('no signal (most regions)', {'ok': True, 'status': None, 'ageLower': None, 'ageUpper': None}, 'none', False),
  ('verified adult', {'ok': True, 'status': 'VERIFIED', 'ageLower': None, 'ageUpper': None}, 'adult', False),
  ('declared 18+', {'ok': True, 'status': 'DECLARED', 'ageLower': 18, 'ageUpper': None}, 'adult', False),
  ('supervised 13-15', {'ok': True, 'status': 'SUPERVISED', 'ageLower': 13, 'ageUpper': 15}, 'minor', True),
  ('supervised 0-12', {'ok': True, 'status': 'SUPERVISED', 'ageLower': 0, 'ageUpper': 12}, 'minor', True),
  ('declared 16-17', {'ok': True, 'status': 'DECLARED', 'ageLower': 16, 'ageUpper': 17}, 'minor', True),
  ('approval pending 13-15', {'ok': True, 'status': 'SUPERVISED_APPROVAL_PENDING', 'ageLower': 13, 'ageUpper': 15}, 'minor', True),
  ('supervised, parent says 18+', {'ok': True, 'status': 'SUPERVISED', 'ageLower': 18, 'ageUpper': None}, 'adult', False),
  ('unknown (applicable region)', {'ok': True, 'status': 'UNKNOWN', 'ageLower': None, 'ageUpper': None}, 'minor', True),
  ('Play error', {'ok': False, 'error': 'AgeSignalsException: -3'}, 'none', False),
  ('plugin throws', 'throw', 'none', False),
  ('plugin hangs (timeout)', 'hang', 'none', False),
  ('plugin missing (old build)', 'missing', 'none', False),
]

res = []
def rec(n, ok, info=''):
    res.append(ok); print('PASS' if ok else 'FAIL', n, info, flush=True)

with sync_playwright() as p:
    b = p.chromium.launch()
    for (w, h) in [(390, 844), (360, 740)]:
        tag = f'{w}x{h}'
        for i, (name, ans, group, child) in enumerate(CASES):
            ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, has_touch=True)
            page = ctx.new_page(); errs = []
            page.on('pageerror', lambda e: errs.append(str(e)))
            page.add_init_script(FAKE % (json.dumps(ans) if isinstance(ans, dict) else json.dumps(ans)))
            page.goto(URL)
            wait = 7500 if ans == 'hang' else 2600 if ans in ('throw',) or (isinstance(ans, dict) and not ans.get('ok')) else 1500
            page.wait_for_timeout(wait + 800)
            st = page.evaluate('() => ({calls: window.__calls, age: window.__ageCalls, group: Ads.ageGroup, init: Ads.initialized})')
            inits = [c for c in st['calls'] if c[0] == 'initialize']
            cons = inits[0][1].get('consent', {}) if inits else None
            ok = (len(inits) == 1 and st['init'] and st['group'] == group and cons.get('gdprConsent') is False
                  and (cons.get('coppa') is True) == child and (cons.get('ccpaDoNotSell') is True) == child
                  and (child or ('coppa' not in cons and 'ccpaDoNotSell' not in cons)))
            rec(f'{tag} {name}: group {group}, child flags {child}', ok, f"asked {st['age']}x consent={cons}")
            if i == 3:  # a minor: the game still plays normally
                page.click('#btn-start-game'); page.wait_for_timeout(1300)
                if page.evaluate("() => { const e=document.getElementById('btn-tutorial-ok'); return !!e && e.offsetParent!==null; }"):
                    page.click('#btn-tutorial-ok'); page.wait_for_timeout(200)
                n0 = page.evaluate('() => activeArrows.length')
                page.screenshot(path=f'{OUT}/{tag}-age-minor-level1.png')
                ovf = page.evaluate('() => document.documentElement.scrollWidth > window.innerWidth')
                rec(f'{tag} minor: level 1 loads, no overflow', n0 > 0 and not ovf, f'arrows={n0}')
            rec(f'{tag} {name}: no page errors', not errs, '; '.join(errs)[:200])
            ctx.close()
    # plain browser (not native): nothing asked, no errors
    ctx = b.new_context(viewport={'width': 390, 'height': 844}); page = ctx.new_page(); errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(URL); page.wait_for_timeout(1800)
    rec('browser preview: ads off, no errors', not errs and page.evaluate('() => Ads.initialized') is False and page.evaluate('() => Ads.ageGroup') == 'none')
    b.close()
print(f'{sum(res)}/{len(res)} passed')
