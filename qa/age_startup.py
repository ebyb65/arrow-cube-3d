# Lena QA (ac-115-qa). Usage: npm run build; python3 -I qa/age_startup.py "$PWD/dist" /tmp/shots "$PWD/qa/age_signals.py"
# 412x915 light+dark: game reaches Home and level 1 is playable before LevelPlay starts, for each Play age answer (incl. hang = 4 s timeout).
import sys, os, json, time, re
from playwright.sync_api import sync_playwright
DIST, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
src = open(sys.argv[3]).read()
FAKE = re.search(r'FAKE = """(.*?)"""', src, re.S).group(1)
cases = [('no signal', {'ok': True, 'ageLower': None, 'ageUpper': None}), ('missing','missing'), ('hang','hang'), ('throw','throw'), ('16-17', {'ok': True, 'ageLower': 16, 'ageUpper': 17})]
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, ans in cases:
      for scheme in ['light','dark']:
        ctx = b.new_context(viewport={'width':412,'height':915}, device_scale_factor=1, has_touch=True, color_scheme=scheme)
        pg = ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.add_init_script(FAKE % json.dumps(ans))
        t0=time.time(); pg.goto('file://'+DIST+'/index.html')
        pg.wait_for_function("!document.getElementById('screen-splash') || getComputedStyle(document.getElementById('screen-splash')).opacity==='0'", timeout=20000)
        t_home=time.time()-t0
        # try to start level 1 right away
        clicked = False
        try:
            pg.get_by_text('PLAY LEVEL').first.click(timeout=3000); clicked=True
        except Exception as e: pass
        pg.wait_for_timeout(500)
        ingame = pg.evaluate("!document.getElementById('screen-game').classList.contains('hidden')")
        pg.wait_for_function("window.__calls.some(c=>c[0]==='initialize')", timeout=15000)
        t_init=time.time()-t0
        init = [c for c in pg.evaluate("window.__calls") if c[0]=='initialize'][0][1]
        pg.screenshot(path=f'{OUT}/412-{name.replace(" ","_")}-{scheme}.png')
        print(f"{name:10s} {scheme}: home {t_home:.1f}s, playable-before-init={ingame and clicked}, init at {t_init:.1f}s, consent={init.get('consent')}, errors={errs}")
        ctx.close()
