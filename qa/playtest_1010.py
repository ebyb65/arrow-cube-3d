# Lena QA play-test (headless Chromium). Usage: npm run build; python3 -I qa/playtest_1010.py "$PWD/dist" /tmp/shots
import sys, json, os, time
from playwright.sync_api import sync_playwright

DIST = sys.argv[1]
OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)
URL = 'file://' + DIST + '/index.html'
results = []
def rec(name, ok, info=''):
    results.append((name, ok, info)); print(('PASS' if ok else 'FAIL'), name, info, flush=True)

HOOK = """
window.__ads = [];
const wrap = () => {
  if (!window.Ads || window.Ads.__wrapped) return;
  const si = window.Ads.showInterstitial.bind(window.Ads);
  window.Ads.showInterstitial = function(cb){
    let inPuzzle = false, lvl = null;
    try { inPuzzle = activeArrows.length > 0 && !document.getElementById('screen-game').classList.contains('hidden'); lvl = currentLevel; } catch(e){}
    window.__ads.push({kind:'interstitial', inPuzzle, lvl, t: Date.now()});
    return si(cb);
  };
  window.Ads.__wrapped = true;
};
document.addEventListener('DOMContentLoaded', () => setTimeout(wrap, 0));
window.addEventListener('load', wrap);
"""

def solve(page, max_steps=400):
    # tap free arrows via the game's own handler until the level is clear
    for _ in range(max_steps):
        n = page.evaluate("""() => {
          const free = activeArrows.filter(a => !animatingArrows.has(a.id) && !checkIsArrowBlocked(a));
          if (free.length) handleArrowTap(free[0].id);
          return [activeArrows.length, free.length];
        }""")
        if n[0] == 0: return True
        if n[1] == 0:
            page.wait_for_timeout(120)
            # all remaining are blocked or animating
            if page.evaluate("() => activeArrows.length>0 && activeArrows.every(a=>checkIsArrowBlocked(a)) && animatingArrows.size===0"):
                return False
        page.wait_for_timeout(30)
    return False

def visible(page, sel):
    return page.evaluate(f"() => {{const e=document.querySelector('{sel}'); return !!e && !e.classList.contains('hidden') && e.offsetParent!==null;}}")

with sync_playwright() as p:
    b = p.chromium.launch()
    for (w, h) in [(360, 740), (412, 915)]:
        tag = f'{w}x{h}'
        ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, has_touch=True)
        page = ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.add_init_script(HOOK)
        page.goto(URL); page.wait_for_timeout(1500)
        page.screenshot(path=f'{OUT}/{tag}-01-home.png')
        # AD_DEBUG
        rec(f'{tag} AD_DEBUG off', page.evaluate('() => AD_DEBUG') is False)
        ver = page.evaluate('() => APP_VERSION'); rec(f'{tag} version', ver == '1.0.10', ver)
        fb = page.evaluate("() => document.getElementById('btn-home-feedback') && (document.getElementById('btn-home-feedback').getAttribute('href')||'')")
        email = page.evaluate('() => FEEDBACK_EMAIL')
        rec(f'{tag} feedback address (known open: ac-feedback-addr)', email != 'support@yebeegames.com', email)
        # start level 1
        page.click('#btn-start-game'); page.wait_for_timeout(1200)
        page.screenshot(path=f'{OUT}/{tag}-02-level1.png')
        if visible(page, '#btn-tutorial-ok'):
            page.evaluate("() => document.getElementById('btn-tutorial-ok').click()"); page.wait_for_timeout(300)
        coins_before = page.evaluate('() => AppState.coins')
        # ---- Eraser checks on level 1 ----
        page.evaluate('() => { AppState.erasers = 2; AppState.save(); updateUI && updateUI(); }')
        page.click('#powerup-btn-eraser'); page.wait_for_timeout(200)
        e1 = page.evaluate('() => [AppState.erasers, isEraserActive]')
        page.click('#powerup-btn-eraser'); page.wait_for_timeout(300)
        e2 = page.evaluate('() => [AppState.erasers, isEraserActive]')
        modal_open = visible(page, '#modal-powerup')
        page.screenshot(path=f'{OUT}/{tag}-03-eraser-twice.png')
        rec(f'{tag} Eraser tapped twice uses one', e1 == [1, True] and e2 == [1, True] and not modal_open, f'{e1} -> {e2}, buy modal {modal_open}')
        bb = page.locator('#btn-cancel-eraser').bounding_box()
        rec(f'{tag} Cancel button size', bb and bb['width'] >= 72 and bb['height'] >= 40, str(bb and (round(bb['width']), round(bb['height']))))
        page.click('#btn-cancel-eraser'); page.wait_for_timeout(300)
        e3 = page.evaluate('() => [AppState.erasers, isEraserActive]')
        rec(f'{tag} Eraser Cancel refunds', e3 == [2, False], str(e3))
        # zero erasers: tapping when active must not open buy modal either
        page.evaluate('() => { AppState.erasers = 1; AppState.save(); }')
        page.click('#powerup-btn-eraser'); page.wait_for_timeout(150)
        page.click('#powerup-btn-eraser'); page.wait_for_timeout(300)
        e4 = page.evaluate('() => [AppState.erasers, isEraserActive]')
        m2 = page.evaluate("() => [...document.querySelectorAll('[id^=modal-]')].filter(e=>!e.classList.contains('hidden')).map(e=>e.id)")
        rec(f'{tag} Eraser twice with last eraser: no buy modal', e4 == [0, True] and not m2, f'{e4} {m2}')
        # erase one arrow with it
        page.evaluate('() => handleArrowTap(activeArrows[0].id)'); page.wait_for_timeout(500)
        rec(f'{tag} Eraser removes an arrow and turns off', page.evaluate('() => isEraserActive') is False)
        # ---- AD_DEBUG text check (simulated unavailable rewarded) ----
        page.evaluate("() => { window.Ads.lastError='SECRET_REASON'; window.__origRew = window.Ads.showRewarded; window.Ads.showRewarded = (ok, no) => no && no('none'); triggerUnityAd('rewarded', ()=>{}); }")
        page.wait_for_timeout(200)
        toast = page.evaluate("() => document.body.innerText.includes('SECRET_REASON')")
        rec(f'{tag} no ad error reason shown to players', not toast)
        page.evaluate("() => { window.Ads.showRewarded = window.__origRew; window.Ads.lastError=null; }")
        # ---- Solve levels 1..10 ----
        solved = []
        for lv in range(1, 11):
            if lv > 1:
                if visible(page, '#btn-next-level'):
                    page.click('#btn-next-level')
                else:
                    print('  no Next button visible before level', lv)
                page.wait_for_timeout(2200)
                cur = page.evaluate('() => currentLevel')
                if cur != lv: print('  expected level', lv, 'got', cur)
                if visible(page, '#btn-tutorial-ok'):
                    page.evaluate("() => document.getElementById('btn-tutorial-ok').click()"); page.wait_for_timeout(200)
            c0 = page.evaluate('() => AppState.coins')
            ok = solve(page)
            page.wait_for_timeout(1600)
            c1 = page.evaluate('() => AppState.coins')
            solved.append((lv, ok, c1 - c0))
            if lv in (1, 6):
                page.screenshot(path=f'{OUT}/{tag}-04-win-l{lv}.png')
        rec(f'{tag} levels 1-10 solvable', all(s[1] for s in solved), str(solved))
        for lv in (26, 60, 121, 200):
            page.evaluate(f'() => {{ document.querySelectorAll("[id^=modal-]").forEach(e=>e.classList.add("hidden")); loadLevel({lv}); }}')
            page.wait_for_timeout(800)
            if visible(page, '#btn-tutorial-ok'):
                page.evaluate("() => document.getElementById('btn-tutorial-ok').click()"); page.wait_for_timeout(200)
            if lv in (26, 121): page.screenshot(path=f'{OUT}/{tag}-05-l{lv}.png')
            n = page.evaluate('() => activeArrows.length')
            ok = solve(page); page.wait_for_timeout(1500)
            rec(f'{tag} level {lv} solvable', ok, f'{n} arrows')
        ads = page.evaluate('() => window.__ads')
        rec(f'{tag} no interstitial during a puzzle', not any(a['inPuzzle'] for a in ads), json.dumps(ads))
        rec(f'{tag} no JS errors', not errs, ' | '.join(errs[:3]))
        # Classic 2D quick look
        page.goto(URL); page.wait_for_timeout(1200)
        if visible(page, '#btn-home-classic2d'):
            page.click('#btn-home-classic2d'); page.wait_for_timeout(1200)
            page.screenshot(path=f'{OUT}/{tag}-06-classic2d.png')
        ctx.close()
    b.close()
print('SUMMARY', sum(1 for r in results if r[1]), '/', len(results))
