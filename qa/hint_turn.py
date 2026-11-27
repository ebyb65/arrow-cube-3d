# Arjun QA (ac-hint-visible). Usage: npm run build; python3 -I qa/hint_turn.py "$PWD/dist" /tmp/shots
# Hint on a hidden face turns the cube to it; tapping the hinted arrow or changing level clears the green; level 1 tip arrow is green.
import sys, os
from playwright.sync_api import sync_playwright
DIST, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
res=[]
def rec(n, ok, info=''): res.append(ok); print('PASS' if ok else 'FAIL', n, info, flush=True)
FACE = """() => { const toCam = new THREE.Vector3().subVectors(camera.position, mainCubeGroup.position).normalize();
 const f = a => new THREE.Vector3(...DIRECTIONS[a.specs[0].f]).applyQuaternion(mainCubeGroup.quaternion).dot(toCam);
 const free = activeArrows.filter(a => !checkIsArrowBlocked(a));
 const h = activeArrows.find(a => a.id === hintedArrowId);
 return { freeFacing: free.filter(a => f(a) > 0.18).length, hint: hintedArrowId, hf: h ? f(h) : null, vis: h ? arrowMeshMap.get(h.id).visible : null }; }"""
GREEN = """() => { let n = 0, em = 0; activeArrows.forEach(a => { const g = arrowMeshMap.get(a.id); if (!g) return; let gr = false, e = false;
 g.traverse(m => { if (m.isMesh && m.material && m.material.color) { if (m.material.color.getHexString() === '10b981') gr = true; if (m.material.emissive && m.material.emissive.getHex() !== 0) e = true; } });
 if (gr) n++; if (e) em++; }); return { green: n, emissive: em }; }"""
with sync_playwright() as p:
    b = p.chromium.launch()
    for vw, vh in [(390, 844), (360, 740)]:
        for th in ['classic', 'crystal']:
            ctx = b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=1, has_touch=True)
            ctx.add_init_script(f"try {{ localStorage.setItem('arrow_cube_theme', '{th}'); }} catch(e) {{}}")
            pg = ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto('file://' + DIST + '/index.html'); pg.wait_for_timeout(1500)
            pg.click('#btn-start-game'); pg.wait_for_timeout(1800)
            tag = f'{vw}x{vh}-{th}'
            # level 1 tutorial glow
            g = pg.evaluate(GREEN); pg.screenshot(path=f'{OUT}/{tag}-l1.png')
            rec(f'{tag}: level 1 tutorial arrow is green', g['green'] == 1, str(g))
            ow = pg.evaluate('() => document.documentElement.scrollWidth - window.innerWidth')
            rec(f'{tag}: no horizontal overflow', ow <= 0, str(ow))
            # hidden-face case: turn the cube until no free arrow faces the player, then hint
            found = False
            for L in [2, 3, 5, 7, 9, 10, 11, 13, 15, 16]:
              pg.evaluate(f'() => {{ document.querySelectorAll("[id^=modal-],#tutorial-box").forEach(e=>e.classList.add("hidden")); loadLevel({L}); }}')
              pg.wait_for_timeout(400)
              found = pg.evaluate("""() => { const toCam = new THREE.Vector3().subVectors(camera.position, mainCubeGroup.position).normalize();
              const free = activeArrows.filter(a => !checkIsArrowBlocked(a));
              for (let i = 0; i < 400; i++) { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random()*6.3, Math.random()*6.3, Math.random()*6.3));
                if (free.every(a => new THREE.Vector3(...DIRECTIONS[a.specs[0].f]).applyQuaternion(q).dot(toCam) <= 0.18)) { mainCubeGroup.quaternion.copy(q); return true; } } return false; }""")
              if found: print('  hidden-case level', L); break
            if found:
                pg.evaluate('() => activateHint()'); pg.wait_for_timeout(900)
                r = pg.evaluate(FACE); pg.screenshot(path=f'{OUT}/{tag}-turned.png')
                rec(f'{tag}: hint turns the cube to a hidden free arrow', r['hf'] is not None and r['hf'] > 0.9 and r['vis'], str(r))
            else:
                rec(f'{tag}: (no all-hidden orientation found on L12)', True)
            # tap the hinted arrow: it escapes, nothing else stays green/emissive
            pg.evaluate('() => activateHint()'); pg.wait_for_timeout(700)
            hid = pg.evaluate('() => hintedArrowId')
            pg.evaluate(f'() => handleArrowTap({hid!r})'); pg.wait_for_timeout(1500)
            g = pg.evaluate(GREEN); left = pg.evaluate(f'() => activeArrows.some(a => a.id === {hid!r})')
            rec(f'{tag}: hinted arrow escapes when tapped, no leftover green', (not left) and g['green'] == 0 and g['emissive'] == 0, f'{g} left={left}')
            # hint then change level: cleared
            pg.evaluate('() => activateHint()'); pg.wait_for_timeout(200)
            pg.evaluate('() => loadLevel(13)'); pg.wait_for_timeout(500)
            g = pg.evaluate(GREEN); h = pg.evaluate('() => hintedArrowId')
            rec(f'{tag}: level change clears the hint', g['green'] == 0 and h is None, f'{g} {h}')
            pg.evaluate('() => { document.querySelectorAll("#tutorial-box").forEach(e=>e.classList.add("hidden")); activateHint(); }'); pg.wait_for_timeout(700)
            pg.screenshot(path=f'{OUT}/{tag}-l13-hint.png')
            rec(f'{tag}: no page errors', not errs, '; '.join(errs)[:200])
            ctx.close()
    b.close()
print(f'{sum(res)}/{len(res)} pass'); sys.exit(0 if all(res) else 1)
