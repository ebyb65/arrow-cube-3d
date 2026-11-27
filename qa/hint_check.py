# Lena QA (ac-hint-visible). Usage: npm run build; python3 -I qa/hint_check.py "$PWD/dist" /tmp/shots
# A used Hint must point at an arrow the player can see (on a face toward the camera) and that arrow
# must still be green half a second later, in an opaque theme (classic) and the see-through one (crystal).
import sys, os
from playwright.sync_api import sync_playwright
DIST, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
res = []
def rec(n, ok, info=''):
    res.append(ok); print('PASS' if ok else 'FAIL', n, info, flush=True)

LEVELS = list(range(1, 31)) + [40, 60, 90, 121, 150, 200]
PROBE = """async () => {
  const before = new Set(activeArrows.map(a => a.id));
  const free = activeArrows.filter(a => !checkIsArrowBlocked(a));
  // find the arrow the hint coloured: wrap material colour setter is overkill; compare emissive instead
  activateHint();
  const toCam = new THREE.Vector3().subVectors(camera.position, mainCubeGroup.position).normalize();
  const facing = a => new THREE.Vector3(...DIRECTIONS[a.specs[0].f]).applyQuaternion(mainCubeGroup.quaternion).dot(toCam);
  const green = a => { let g = false; const grp = arrowMeshMap.get(a.id); if (grp) grp.traverse(m => {
      if (m.isMesh && m.material && m.material.color && m.material.color.getHexString() === '10b981') g = true; }); return g; };
  const t0 = activeArrows.filter(green);
  await new Promise(r => setTimeout(r, 500));
  const t1 = activeArrows.filter(green);
  const target = t0[0];
  return { free: free.length, freeFacing: free.filter(a => facing(a) > 0.18).length,
           marked: t0.length, targetFacing: target ? facing(target) : null,
           targetVisible: target ? arrowMeshMap.get(target.id).visible : null, greenAfter500ms: t1.length };
}"""

with sync_playwright() as p:
    b = p.chromium.launch()
    for th in ['classic', 'crystal']:
        ctx = b.new_context(viewport={'width': 360, 'height': 740}, device_scale_factor=1, has_touch=True)
        ctx.add_init_script(f"try {{ localStorage.setItem('arrow_cube_theme', '{th}'); for (let i = 1; i < 300; i++) localStorage.setItem('arrow_cube_tut_' + i, '1'); }} catch(e) {{}}")
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file://' + DIST + '/index.html'); pg.wait_for_timeout(1500)
        pg.click('#btn-start-game'); pg.wait_for_timeout(1200)
        unseen, faded = [], []
        for L in LEVELS:
            pg.evaluate(f'() => {{ document.querySelectorAll("[id^=modal-]").forEach(e=>e.classList.add("hidden")); loadLevel({L}); }}')
            pg.wait_for_timeout(500)
            r = pg.evaluate(PROBE)
            if r['freeFacing'] > 0 and (r['targetFacing'] is None or r['targetFacing'] <= 0.18 or not r['targetVisible']):
                unseen.append(L)
            if r['greenAfter500ms'] == 0:
                faded.append(L)
            if L == 12:
                pg.screenshot(path=f'{OUT}/hint-{th}-l12.png')
        rec(f'{th}: hint points at an arrow on a visible face (when one is free)', not unseen, f'not visible on levels {unseen}')
        rec(f'{th}: hinted arrow is still green after 0.5 s', not faded, f'colour gone on levels {faded[:12]}{"..." if len(faded) > 12 else ""}')
        rec(f'{th}: no page errors', not errs, '; '.join(errs)[:200])
        ctx.close()
    b.close()
print(f'{sum(res)}/{len(res)} pass')
sys.exit(0 if all(res) else 1)
