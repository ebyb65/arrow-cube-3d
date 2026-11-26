# Arjun QA (ac-intro-cards). Usage: npm run build; python3 -I qa/intro_cards.py "$PWD/dist" /tmp/shots
import sys, os
from playwright.sync_api import sync_playwright
DIST, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
URL = 'file://' + DIST + '/index.html'
res = []
def rec(n, ok, info=''):
    res.append(ok); print('PASS' if ok else 'FAIL', n, info, flush=True)
def vis(page, sel):
    return page.evaluate(f"() => {{const e=document.querySelector('{sel}'); return !!e && !e.classList.contains('hidden') && e.offsetParent!==null;}}")
def tiptext(page):
    return page.evaluate("() => document.getElementById('tutorial-tip').classList.contains('hidden') ? null : document.getElementById('tutorial-title').textContent + ' | ' + document.getElementById('tutorial-text').textContent + ' | ' + [...document.querySelectorAll('#tutorial-tip button')].filter(b=>!b.classList.contains('hidden')).map(b=>b.textContent).join('/')")
with sync_playwright() as p:
    b = p.chromium.launch()
    for (w, h) in [(390, 844), (360, 740)]:
        tag = f'{w}x{h}'
        ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, has_touch=True)
        page = ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.goto(URL); page.wait_for_timeout(1500)
        page.click('#btn-start-game'); page.wait_for_timeout(1300)
        if vis(page, '#btn-tutorial-ok'): page.click('#btn-tutorial-ok'); page.wait_for_timeout(200)
        page.evaluate('() => { AppState.erasers = 2; AppState.wands = 2; AppState.save(); AppState.syncUI(); }')
        # Eraser first tap
        page.click('#powerup-btn-eraser'); page.wait_for_timeout(300)
        t = tiptext(page); page.screenshot(path=f'{OUT}/{tag}-1-eraser-card.png')
        rec(f'{tag} eraser card on first use', t and 'Tap Cancel to keep it' in t and t.endswith('Got it'), t)
        # overlap check: card vs power-up bar and Cancel button
        ov = page.evaluate("""() => { const r=e=>document.getElementById(e).getBoundingClientRect();
          const a=r('tutorial-tip'); const hit=b=>!(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top);
          return {bar: ['powerup-btn-eraser','powerup-btn-wand','powerup-btn-hint'].some(i=>hit(r(i))), cancel: hit(r('btn-cancel-eraser'))}; }""")
        rec(f'{tag} card covers neither power-ups nor Cancel', not ov['bar'] and not ov['cancel'], str(ov))
        page.click('#btn-cancel-eraser'); page.wait_for_timeout(300)
        rec(f'{tag} Cancel hides eraser card, refunds', tiptext(page) is None and page.evaluate('()=>[AppState.erasers,isEraserActive]') == [2, False])
        page.click('#powerup-btn-eraser'); page.wait_for_timeout(300)
        rec(f'{tag} eraser card only once', tiptext(page) is None)
        page.evaluate('() => handleArrowTap(activeArrows[0].id)'); page.wait_for_timeout(400)
        rec(f'{tag} erase still works', page.evaluate('()=>[AppState.erasers,isEraserActive]') == [1, False])
        # Wand first tap: confirm, Not now
        n0 = page.evaluate('() => activeArrows.length')
        page.click('#powerup-btn-wand'); page.wait_for_timeout(300)
        t = tiptext(page); page.screenshot(path=f'{OUT}/{tag}-2-wand-card.png')
        rec(f'{tag} wand asks first', t and 'removes 3 blocking arrows. Use it?' in t and t.endswith('Not now/Use'), t)
        rec(f'{tag} wand not fired before answer', page.evaluate('()=>[AppState.wands,activeArrows.length]') == [2, n0])
        page.click('#btn-tutorial-no'); page.wait_for_timeout(300)
        rec(f'{tag} Not now: nothing used', page.evaluate('()=>[AppState.wands,activeArrows.length]') == [2, n0] and tiptext(page) is None)
        page.click('#powerup-btn-wand'); page.wait_for_timeout(1200)
        st = page.evaluate('()=>[AppState.wands,activeArrows.length]')
        rec(f'{tag} second tap fires at once (one-time card)', tiptext(page) is None and st[0] == 1 and st[1] < n0, f'{n0} -> {st}')
        # Wand Use path on a fresh profile
        page.evaluate("() => { localStorage.removeItem('arrow_cube_tut_wand'); document.querySelectorAll('[id^=modal-]').forEach(e=>e.classList.add('hidden')); loadLevel(5); }"); page.wait_for_timeout(1200)
        n1 = page.evaluate('() => activeArrows.length')
        page.click('#powerup-btn-wand'); page.wait_for_timeout(300)
        page.click('#btn-tutorial-ok'); page.wait_for_timeout(1200)
        st = page.evaluate('()=>[AppState.wands,activeArrows.length]')
        rec(f'{tag} Use fires the wand once', st[0] == 0 and st[1] < n1, f'{n1} -> {st}')
        # Use after leaving level does nothing
        page.evaluate("() => { localStorage.removeItem('arrow_cube_tut_wand'); AppState.wands=1; AppState.save(); AppState.syncUI(); }")
        page.click('#powerup-btn-wand'); page.wait_for_timeout(200)
        page.evaluate("() => loadLevel(6)"); page.wait_for_timeout(1000)
        rec(f'{tag} new level hides stale wand card', tiptext(page) is None)
        # Level 26 card
        page.evaluate("() => { document.querySelectorAll('[id^=modal-]').forEach(e=>e.classList.add('hidden')); loadLevel(26); }"); page.wait_for_timeout(1200)
        t = tiptext(page); page.screenshot(path=f'{OUT}/{tag}-3-level26.png')
        rec(f'{tag} level 26 card', t == 'Two cubes now! | Spin to find arrows on every side. | Got it', t)
        page.click('#btn-tutorial-ok'); page.wait_for_timeout(200)
        page.evaluate("() => loadLevel(26)"); page.wait_for_timeout(1200)
        rec(f'{tag} level 26 card once', tiptext(page) is None)
        page.evaluate("() => loadLevel(25)"); page.wait_for_timeout(1000)
        rec(f'{tag} level 25 is one cube / no card', tiptext(page) is None)
        ovf = page.evaluate('() => document.documentElement.scrollWidth > window.innerWidth')
        rec(f'{tag} no horizontal overflow', not ovf)
        rec(f'{tag} no page errors', not errs, ' | '.join(errs[:3]))
        ctx.close()
    b.close()
print('ALL PASS' if all(res) else 'SOME FAIL')
