// Level generator for Block Escape 3D: random gates and blocks, keep levels the solver
// proves solvable (the solution path itself is the proof), sorted into a difficulty ramp.
const BE = require('./logic.js');
const fs = require('fs');

let seed = Number(process.argv[2] || 20261123);
function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
function pick(a) { return a[ri(0, a.length - 1)]; }

const SHAPES = {
  1: [[0, 0]],
  2: [[0, 0], [1, 0]],
  3: [[0, 0], [1, 0], [2, 0]],
  L: [[0, 0], [1, 0], [0, 1]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
};

function cellOn(f, u, v, N) {
  const ax = Math.floor(f / 2), sign = f % 2 ? -1 : 1;
  const t = [0, 1, 2].filter(a => a !== ax);
  const c = [0, 0, 0];
  c[ax] = sign * N; c[t[0]] = 2 * u + 1 - N; c[t[1]] = 2 * v + 1 - N;
  return c;
}

function makeLevel(cfg) {
  const N = cfg.n, colors = cfg.colors;
  // gates
  const gates = [], used = {};
  const edges = [];
  for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) if (Math.floor(a / 2) !== Math.floor(b / 2)) edges.push([a, b]);
  for (let ci = 0; ci < colors; ci++) {
    const ng = ri(cfg.gatesPer[0], cfg.gatesPer[1]);
    for (let g = 0; g < ng; g++) {
      for (let t = 0; t < 30; t++) {
        const [a, b] = pick(edges), k = BE.edgeKey(a, b);
        const w = ri(cfg.gateW[0], Math.min(cfg.gateW[1], N));
        const s = ri(0, N - w);
        const lanes = []; for (let x = s; x < s + w; x++) lanes.push(2 * x + 1 - N);
        used[k] = used[k] || new Set();
        // keep one free lane between gates on the same edge
        if (lanes.some(l => used[k].has(l) || used[k].has(l - 2) || used[k].has(l + 2))) continue;
        lanes.forEach(l => used[k].add(l));
        gates.push({ a, b, lanes, color: ci });
        break;
      }
    }
  }
  const gateColors = new Set(gates.map(g => g.color));
  const maxW = {}; gates.forEach(g => { maxW[g.color] = Math.max(maxW[g.color] || 0, g.lanes.length); });
  // blocks
  const occ = new Map(); // cell key -> color
  const blocks = [];
  for (let t = 0; blocks.length < cfg.blocks && t < 2000; t++) {
    const sh = SHAPES[pick(cfg.shapes)];
    const rot = ri(0, 3);
    let pts = sh.map(([x, y]) => rot === 0 ? [x, y] : rot === 1 ? [-y, x] : rot === 2 ? [-x, -y] : [y, -x]);
    const mx = Math.min(...pts.map(p => p[0])), my = Math.min(...pts.map(p => p[1]));
    pts = pts.map(([x, y]) => [x - mx, y - my]);
    const w = Math.max(...pts.map(p => p[0])) + 1, h = Math.max(...pts.map(p => p[1])) + 1;
    if (w > N || h > N) continue;
    const narrow = Math.min(w, h);
    const color = pick([...gateColors]);
    if (maxW[color] < narrow) continue;
    const f = ri(0, 5), u0 = ri(0, N - w), v0 = ri(0, N - h);
    const cells = pts.map(([x, y]) => cellOn(f, u0 + x, v0 + y, N));
    const keys = cells.map(c => c.join(','));
    if (keys.some(k => occ.has(k))) continue;
    // no same-colour neighbours on the same face (they would look like one block)
    const touchSame = cells.some(c => [0, 1, 2].some(a => [-2, 2].some(dd => {
      const q = c.slice(); q[a] += dd; return occ.get(q.join(',')) === color;
    })));
    if (touchSame) continue;
    keys.forEach(k => occ.set(k, color));
    blocks.push({ color, cells });
  }
  if (blocks.length < cfg.blocks) return null;
  // drop colours that have no block (unused gates)
  const usedCols = new Set(blocks.map(b => b.color));
  return { n: N, gates: gates.filter(g => usedCols.has(g.color)), blocks };
}

function freeCount(level, st) {
  let f = 0;
  st.forEach((cs, i) => {
    if (BE.tangents(BE.faceOf(cs[0], level.n)).some(d => BE.move(level, st, i, d).kind === 'exit')) f++;
  });
  return f;
}

// count, n, blocks, colours, gatesPer, gateW, shapes, par range, extra range (par - blocks), rolls min, max free at start
const tiers = [
  { count: 1, n: 3, blocks: 1, colors: 1, gatesPer: [1, 1], gateW: [1, 1], shapes: ['1'], par: [1, 1], extra: [0, 0], rolls: 0, maxRolls: 0 },
  { count: 1, n: 3, blocks: 1, colors: 1, gatesPer: [1, 1], gateW: [1, 2], shapes: ['2'], par: [2, 3], extra: [1, 2], rolls: 1 },
  { count: 1, n: 3, blocks: 3, colors: 2, gatesPer: [1, 1], gateW: [1, 2], shapes: ['1', '2'], par: [3, 4], extra: [0, 1], rolls: 0, maxFree: 2 },
  { count: 4, n: 3, blocks: 4, colors: 2, gatesPer: [1, 2], gateW: [1, 2], shapes: ['1', '2', '2'], par: [5, 7], extra: [1, 3], rolls: 1, maxFree: 2 },
  { count: 5, n: 3, blocks: 6, colors: 3, gatesPer: [1, 2], gateW: [1, 2], shapes: ['1', '2', '2', '3', 'L'], par: [8, 11], extra: [2, 5], rolls: 1, maxFree: 2 },
  { count: 4, n: 4, blocks: 6, colors: 3, gatesPer: [1, 2], gateW: [1, 3], shapes: ['1', '2', '2', '3', 'L', 'O'], par: [9, 14], extra: [3, 8], rolls: 2, maxFree: 2, cap: 60000, ms: 400000 },
  { count: 4, n: 4, blocks: 8, colors: 3, gatesPer: [1, 2], gateW: [1, 3], shapes: ['1', '2', '2', '3', 'L', 'O'], par: [12, 20], extra: [4, 12], rolls: 2, maxFree: 2, cap: 60000, ms: 400000 },
];

const levels = [];
const t0 = Date.now();
const only = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
for (const [ti, cfg] of tiers.entries()) {
  if (only && !only.includes(ti)) continue;
  const pool = [];
  let attempts = 0; const tStart = Date.now();
  while (pool.length < cfg.count * 3 && attempts++ < (cfg.tries || 4000) && Date.now() - tStart < (cfg.ms || 90000)) {
    const lv = makeLevel(cfg);
    if (!lv) continue;
    const st = lv.blocks.map(b => b.cells);
    if (cfg.maxFree && freeCount(lv, st) > cfg.maxFree) continue;
    // each block must be able to escape on its own (cheap filter)
    if (!st.every((cs, i) => { const one = st.map((c, j) => j === i ? c : null); const r = BE.bfs(lv, one, 5000); return r && r.moves > 0; })) continue;
    const s = BE.solve(lv, st, cfg.cap || 25000);
    if (!s || s.moves < 0) continue;
    const extra = s.moves - lv.blocks.length;
    if (s.moves < cfg.par[0] || s.moves > cfg.par[1]) continue;
    if (extra < cfg.extra[0] || extra > cfg.extra[1]) continue;
    if (s.rolls < cfg.rolls) continue;
    if (cfg.maxRolls !== undefined && s.rolls > cfg.maxRolls) continue;
    pool.push({ lv, par: s.moves, rolls: s.rolls, extra });
  }
  pool.sort((a, b) => a.par - b.par);
  const step = pool.length / cfg.count;
  for (let i = 0; i < cfg.count && pool.length; i++) {
    const c = pool[Math.min(pool.length - 1, Math.floor(i * step))];
    levels.push({ n: c.lv.n, par: c.par, rolls: c.rolls, gates: c.lv.gates, blocks: c.lv.blocks });
  }
  console.error(`tier n=${cfg.n} blocks=${cfg.blocks}: tried ${attempts}, pool ${pool.length} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
levels.forEach((l, i) => console.error(`L${i + 1}: n=${l.n} blocks=${l.blocks.length} colours=${new Set(l.blocks.map(b => b.color)).size} gates=${l.gates.length} par=${l.par} rolls=${l.rolls}`));
fs.writeFileSync(process.argv[4] || (__dirname + '/levels.json'), JSON.stringify(levels));
