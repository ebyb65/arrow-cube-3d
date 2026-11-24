// Builds the web game into dist/ with every library bundled locally,
// so the app starts offline and never depends on a CDN.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dist = path.join(root, 'dist');
const assets = path.join(dist, 'assets');
const nm = path.join(root, 'node_modules');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(assets, 'files'), { recursive: true });

// 1. Tailwind CSS (compiled, minified)
execSync(
  `npx tailwindcss -c tailwind.config.cjs -i src/tailwind.css -o dist/assets/app.css --minify`,
  { cwd: root, stdio: 'inherit' }
);

// 2. Three.js r128 (same version the game was written for)
fs.copyFileSync(path.join(nm, 'three/build/three.min.js'), path.join(assets, 'three.min.js'));

// 3. Fonts (latin subset only, woff2)
const fonts = [
  ['fredoka', [400, 500, 600, 700]],
  ['inter', [400, 500, 600, 700, 800]],
  ['jetbrains-mono', [500, 700]],
];
let fontCss = '';
for (const [pkg, weights] of fonts) {
  for (const w of weights) {
    const file = `${pkg}-latin-${w}-normal.woff2`;
    const src = path.join(nm, '@fontsource', pkg, 'files', file);
    if (!fs.existsSync(src)) throw new Error(`Missing font file ${src}`);
    fs.copyFileSync(src, path.join(assets, 'files', file));
    const family = pkg === 'jetbrains-mono' ? 'JetBrains Mono' : pkg[0].toUpperCase() + pkg.slice(1);
    fontCss += `@font-face{font-family:'${family}';font-style:normal;font-display:swap;font-weight:${w};src:url(./files/${file}) format('woff2');}\n`;
  }
}
fs.writeFileSync(path.join(assets, 'fonts.css'), fontCss);

// 4. Game files
fs.copyFileSync(path.join(root, 'index.html'), path.join(dist, 'index.html'));
fs.copyFileSync(path.join(root, 'src/ads.js'), path.join(assets, 'ads.js'));
fs.copyFileSync(path.join(root, 'src/classic2d.js'), path.join(assets, 'classic2d.js'));

// Guard: no remote scripts or styles may remain in the shipped page
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const remote = html.match(/(src|href)=["']https?:\/\/[^"']+\.(js|css)[^"']*["']|@import url\(['"]?https?:/g);
if (remote) throw new Error('Remote asset still referenced: ' + remote.join(', '));

console.log('Built dist/ (offline-ready)');
