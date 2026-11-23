# Block Escape 3D prototype

A one-page playable prototype for the CEO's decision on game #3. Not part of the Arrow Cube app build.
Design spec: docs/design/block-escape-3d.md

- `logic.js` rules and solver (shared by the page and the generator)
- `gen.js` level generator: `node gen.js <seed> <tier list> <out.json>` (every kept level is solved, par = fewest swipes)
- `levels.json` the 16 levels in the prototype (12 on 3x3 faces, 4 on 4x4)
- `index.src.html` the page; `node build.js levels.json` inlines Three.js (from node_modules), logic and levels into `dist/index.html`
