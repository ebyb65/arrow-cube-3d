// Makes the Play Store screenshots for Arrow Cube 3D from the web build.
// Run from the repo root:  npm run build && node store/make_screenshots.cjs
// Output: store/screenshots/raw/*.png (plain game, 1080x1920) and
//         store/screenshots/*.png (captioned store frames, 1080x1920).
// The game is shown with a demo save (level 48, a 4-day streak, a few themes owned)
// seeded into localStorage. Every screen is real UI from the build; nothing is drawn on top.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const root = path.resolve(__dirname, '..');
const page_url = 'file://' + path.join(root, 'dist', 'index.html');
const outRaw = path.join(__dirname, 'screenshots', 'raw');
fs.mkdirSync(outRaw, { recursive: true });
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;

const day = (off) => { const d = new Date(Date.now() + off * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function seed(extra) {
  const stars = {}; for (let l = 1; l < 48; l++) stars[l] = (l % 5 === 0) ? 2 : 3;
  return Object.assign({
    arrow_cube_coins_v3: '2450', arrow_cube_max_level: '48', arrow_cube_current_level: '48',
    arrow_cube_player_name: 'Player 1', arrow_cube_levels_cleared_count: '47',
    arrow_cube_level_stars: JSON.stringify(stars),
    arrow_cube_daily_last: '', arrow_cube_daily_streak: '4',
    arrow_cube_owned_themes: JSON.stringify(['classic', 'wood', 'crystal']), arrow_cube_theme: 'classic',
    arrow_cube_hints: '3', arrow_cube_erasers: '2', arrow_cube_wands: '1',
    arrow_cube_tut_1: '1', arrow_cube_tut_2: '1', arrow_cube_tut_3: '1',
  }, extra || {});
}

// Helpers that run in the page
async function playLevel(page, lvl) {
  await page.evaluate(l => {
    document.getElementById('screen-home').classList.add('hidden');
    document.getElementById('screen-game').classList.remove('hidden');
    loadLevel(l);
  }, lvl);
  await page.waitForTimeout(1200);
}
const hideToast = (page) => page.evaluate(() => { const t = document.getElementById('toast-message'); if (t) t.style.display = 'none'; });

const shots = [
  { file: '01-tap-slide-clear', title: 'Tap. Slide. Clear.', sub: 'A calm 3D logic puzzle', run: async (page) => {
      await playLevel(page, 12); await hideToast(page);
      await page.evaluate(() => applyRotation(0.12, -0.25));
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        const dir = new THREE.Vector3().subVectors(camera.position, mainCubeGroup.position).normalize();
        const facing = a => new THREE.Vector3(...DIRECTIONS[a.specs[0].f]).applyQuaternion(mainCubeGroup.quaternion).dot(dir) > 0.5;
        const a = activeArrows.find(a => facing(a) && !checkIsArrowBlocked(a));
        if (a) handleArrowTap(a.id);
      });
      await page.waitForTimeout(90);
  } },
  { file: '02-turn-the-cube', title: 'Turn the cube', sub: 'Every side hides a move', run: async (page) => {
      await playLevel(page, 20); await hideToast(page);
      await page.evaluate(() => applyRotation(0.55, 0.95));
      await page.waitForTimeout(500);
  } },
  { file: '03-find-the-order', title: 'Find the right order', sub: 'Blocked arrows turn red', run: async (page) => {
      await playLevel(page, 8);
      await page.evaluate(() => applyRotation(0.1, 0.2));
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        const dir = new THREE.Vector3().subVectors(camera.position, mainCubeGroup.position).normalize();
        const facing = a => new THREE.Vector3(...DIRECTIONS[a.specs[0].f]).applyQuaternion(mainCubeGroup.quaternion).dot(dir) > 0.5;
        const a = activeArrows.find(a => facing(a) && checkIsArrowBlocked(a));
        if (a) handleArrowTap(a.id);
      });
      await page.waitForTimeout(450);
  } },
  { file: '04-bigger-shapes', title: 'Bigger shapes', sub: 'Puzzles grow as you play', run: async (page) => {
      await playLevel(page, 150); await hideToast(page);
      await page.evaluate(() => applyRotation(0.35, 0.6));
      await page.waitForTimeout(600);
  } },
  { file: '05-daily-puzzle', title: 'Daily puzzle', sub: 'Keep your streak going', seed: { arrow_cube_daily_last: day(-1) }, run: async (page) => {
      await page.evaluate(() => openEvents()); await page.waitForTimeout(400);
  } },
  { file: '06-treasure', title: 'Open chests', sub: 'Coins and helpers as you go', seed: { arrow_cube_chest_level: '40', arrow_cube_chest_ready_at: '0' }, run: async (page) => {
      await page.evaluate(() => { openChestModal(); Math.random = () => 0.6; grantChest(); }); await page.waitForTimeout(400);
  } },
  { file: '07-make-it-yours', title: 'Make it yours', sub: 'Unlock themes', seed: { arrow_cube_theme: 'crystal', arrow_cube_owned_themes: JSON.stringify(['classic', 'wood', 'crystal', 'neon']) }, run: async (page) => {
      await playLevel(page, 22); await hideToast(page);
      await page.evaluate(() => applyRotation(0.3, -0.6));
      await page.waitForTimeout(500);
  } },
];

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const s of shots) {
    if (ONLY && !ONLY.includes(s.file.slice(0, 2))) continue;
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
    await ctx.addInitScript(kv => { if (!sessionStorage.getItem('seeded')) { for (const k in kv) localStorage.setItem(k, kv[k]); sessionStorage.setItem('seeded', '1'); } }, seed(s.seed));
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('page error', s.file, e.message));
    await page.goto(page_url);
    await page.waitForTimeout(3500);           // splash
    await s.run(page);
    await page.screenshot({ path: path.join(outRaw, s.file + '.png') });
    await ctx.close();
  }
  // Captioned store frames (Yebee frame style, Arrow Cube colours)
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  for (const s of shots) {
    if (ONLY && !ONLY.includes(s.file.slice(0, 2))) continue;
    const img = 'data:image/png;base64,' + fs.readFileSync(path.join(outRaw, s.file + '.png')).toString('base64');
    await page.setContent(`<!doctype html><html><head><style>
      html,body{margin:0;width:360px;height:640px;overflow:hidden;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
      body{background:linear-gradient(160deg,#0ea5e9 0%,#2563eb 50%,#1e1b4b 100%);color:#fff;text-align:center}
      h1{margin:44px 18px 4px;font-size:32px;font-weight:900;letter-spacing:-.5px;line-height:1.05}
      p{margin:0 18px;font-size:17px;font-weight:600;opacity:.9}
      .phone{position:absolute;left:50%;top:150px;transform:translateX(-50%);width:262px;height:466px;border-radius:30px;
        overflow:hidden;border:7px solid #0f172a;box-shadow:0 24px 48px rgba(0,0,0,.35)}
      .phone img{width:100%;height:100%;object-fit:cover;display:block}
    </style></head><body><h1>${s.title}</h1><p>${s.sub}</p><div class="phone"><img src="${img}"></div></body></html>`);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(__dirname, 'screenshots', s.file + '.png') });
  }
  await browser.close();
  console.log('Done');
})();
