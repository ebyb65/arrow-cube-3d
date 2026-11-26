# Arjun QA (ac-crystal-ghosts). Usage: npm run build; python3 -I qa/crystal_ghosts.py "$PWD/dist" /tmp/shots
# Crystal (see-through cube) hides arrows on faces pointing away from the camera; opaque themes keep
# showing them dimmed as before. Tapping a facing arrow still works and hidden arrows come back on rotate.
import sys, os
from playwright.sync_api import sync_playwright
DIST, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
URL = 'file://' + DIST + '/index.html'
res = []
def rec(n, ok, info=''):
    res.append(ok); print('PASS' if ok else 'FAIL', n, info, flush=True)

STATS = """() => {
  const toCam = new THREE.Vector3().subVectors(camera.position, mainCubeGroup.position).normalize();
  const out = { back: 0, backShown: 0, front: 0, frontHidden: 0, side: 0, sideHidden: 0 };
  activeArrows.forEach(a => {
    const g = arrowMeshMap.get(a.id); if (!g || !a.specs || !a.specs.length) return;
    const n = new THREE.Vector3(...DIRECTIONS[a.specs[0].f]).applyQuaternion(mainCubeGroup.quaternion);
    const d = n.dot(toCam);
    if (d < -0.2) { out.back++; if (g.visible) out.backShown++; }
    else if (d > 0.18) { out.front++; if (!g.visible) out.frontHidden++; }
    else { out.side++; if (!g.visible) out.sideHidden++; }
  });
  return out;
}"""

with sync_playwright() as p:
    b = p.chromium.launch()
    for (w, h) in [(390, 844), (360, 740)]:
        tag = f'{w}x{h}'
        for th in ['crystal', 'classic', 'wood']:
            ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, has_touch=True)
            ctx.add_init_script(f"try {{ localStorage.setItem('arrow_cube_theme', '{th}'); localStorage.setItem('arrow_cube_tut_l1','1'); }} catch(e) {{}}")
            page = ctx.new_page(); errs = []
            page.on('pageerror', lambda e: errs.append(str(e)))
            page.goto(URL); page.wait_for_timeout(1500)
            page.click('#btn-start-game'); page.wait_for_timeout(1200)
            page.evaluate('() => { document.querySelectorAll("[id^=modal-]").forEach(e=>e.classList.add("hidden")); document.getElementById("tutorial-tip").classList.add("hidden"); loadLevel(12); }')
            page.wait_for_timeout(900)
            eq = page.evaluate('() => AppState.equippedTheme')
            s0 = page.evaluate(STATS)
            page.screenshot(path=f'{OUT}/{tag}-{th}-l12.png')
            if th == 'crystal':
                rec(f'{tag} crystal: far-side arrows hidden', eq == 'crystal' and s0['back'] > 0 and s0['backShown'] == 0, str(s0))
                rec(f'{tag} crystal: facing and side arrows shown', s0['front'] > 0 and s0['frontHidden'] == 0 and s0['sideHidden'] == 0, str(s0))
                # turn the cube half way round: the hidden ones must come back
                page.evaluate('() => { applyRotation(0, Math.PI); }'); page.wait_for_timeout(400)
                s1 = page.evaluate(STATS)
                page.screenshot(path=f'{OUT}/{tag}-{th}-l12-turned.png')
                rec(f'{tag} crystal: after turning, new far side hidden, new front shown',
                    s1['backShown'] == 0 and s1['frontHidden'] == 0 and s1['front'] > 0, str(s1))
                # tap a free facing arrow by calling the tap handler the pointer code uses
                before = page.evaluate('() => activeArrows.length')
                aid = page.evaluate("""() => {
                  const toCam = new THREE.Vector3().subVectors(camera.position, mainCubeGroup.position).normalize();
                  const a = activeArrows.find(a => !checkIsArrowBlocked(a) && new THREE.Vector3(...DIRECTIONS[a.specs[0].f]).applyQuaternion(mainCubeGroup.quaternion).dot(toCam) > 0.18);
                  return a ? a.id : null; }""")
                if aid is not None:
                    page.evaluate(f'() => handleArrowTap({aid!r})'); page.wait_for_timeout(1200)
                after = page.evaluate('() => activeArrows.length')
                rec(f'{tag} crystal: tapping a free facing arrow still escapes it', aid is not None and after == before - 1, f'{before}->{after}')
            else:
                rec(f'{tag} {th}: opaque theme unchanged (every arrow visible)', eq == th and s0['backShown'] == s0['back'] and s0['frontHidden'] == 0 and s0['sideHidden'] == 0, str(s0))
            ovf = page.evaluate('() => document.documentElement.scrollWidth > window.innerWidth')
            rec(f'{tag} {th}: no page errors, no horizontal overflow', not errs and not ovf, '; '.join(errs)[:200])
            ctx.close()
    b.close()
print(f'{sum(res)}/{len(res)} pass')
sys.exit(0 if all(res) else 1)
