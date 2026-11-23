// Block Escape 3D - core rules, shared by the game page and the level generator.
//
// The board is the SURFACE of a cube: six faces of N x N cells.
// Cells use doubled integer coordinates: on face +X a cell centre is (N, 2u+1-N, 2v+1-N), etc.
// Each block is a set of cells on one face and has a colour.
// Gates are coloured stretches of the cube's 12 edges.
//
// A swipe moves a block in one of the four directions of its face:
//  - it slides cell by cell until it touches another block or the edge of the face;
//  - when it reaches an edge whose gate has its colour and is wide enough, it leaves the cube;
//  - a gate of another colour is a wall;
//  - if the block is ALREADY touching a plain edge when you swipe toward it, it rolls over the
//    edge onto the next face and keeps sliding there (one roll per swipe).
(function (root) {
  const FACES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const add = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const ck = c => c[0] + ',' + c[1] + ',' + c[2];

  function faceOf(c, N) {
    for (let a = 0; a < 3; a++) {
      if (c[a] === N) return a * 2;
      if (c[a] === -N) return a * 2 + 1;
    }
    return -1;
  }
  function faceIdx(v) { for (let i = 0; i < 6; i++) if (dot(FACES[i], v) === 1) return i; return -1; }
  function axisOf(v) { return v[0] ? 0 : v[1] ? 1 : 2; }
  function edgeKey(fa, fb) { return fa < fb ? fa + '-' + fb : fb + '-' + fa; }

  // gates: [{a: face, b: face, lanes: [odd ints on the third axis], color}]
  function gateMap(level) {
    if (level._gm) return level._gm;
    const m = {};
    for (const g of level.gates) {
      const k = edgeKey(g.a, g.b);
      m[k] = m[k] || {};
      for (const l of g.lanes) m[k][l] = g.color;
    }
    Object.defineProperty(level, '_gm', { value: m, enumerable: false });
    return m;
  }

  function occupied(state, except) {
    const s = new Set();
    state.forEach((cells, i) => { if (cells && i !== except) cells.forEach(c => s.add(ck(c))); });
    return s;
  }

  // Returns {state, events:[{t:'step'|'roll'|'exit', cells(before), n, d}], kind} kind: none|slide|roll|exit
  function occMap(state) {
    const m = new Map();
    state.forEach((cells, i) => { if (cells) cells.forEach(c => m.set(ck(c), i)); });
    return m;
  }

  function move(level, state, i, d, om) {
    const N = level.n, color = level.blocks[i].color;
    let cells = state[i];
    if (!cells) return { state, events: [], kind: 'none' };
    let n = FACES[faceOf(cells[0], N)];
    if (dot(n, d) !== 0) return { state, events: [], kind: 'none' };
    om = om || occMap(state);
    const occ = { has: k => { const v = om.get(k); return v !== undefined && v !== i; } };
    const gm = gateMap(level);
    const events = [];
    let moved = 0, rolled = false;
    const finish = (newCells, kind) => {
      const ns = state.slice(); ns[i] = newCells;
      return { state: ns, events, kind, rolled };
    };
    for (let guard = 0; guard < 64; guard++) {
      const front = Math.max(...cells.map(c => dot(c, d)));
      if (front === N - 1) {
        const ax = 3 - axisOf(n) - axisOf(d);
        const gates = gm[edgeKey(faceIdx(n), faceIdx(d))] || {};
        const lanes = [...new Set(cells.map(c => c[ax]))];
        const cols = lanes.map(l => gates[l]);
        if (cols.every(c => c === color)) {
          // every cell must have a clear run to the edge
          const clear = cells.every(c => {
            for (let p = add(c, d, 2); dot(p, d) <= N - 1; p = add(p, d, 2)) if (occ.has(ck(p))) return false;
            return true;
          });
          if (clear) { events.push({ t: 'exit', cells, n, d }); return finish(null, 'exit'); }
          return finish(cells, moved || rolled ? (rolled ? 'roll' : 'slide') : 'none');
        }
        if (cols.some(c => c !== undefined)) return finish(cells, rolled ? 'roll' : moved ? 'slide' : 'none');
        if (moved || rolled) return finish(cells, rolled ? 'roll' : 'slide');
        // roll over the edge like a train round a corner: the whole block moves onto the next
        // face, keeping its lanes; the cell that was last is now nearest the edge.
        // c' = c + k d + (k - 2L) n, with k = N - c.d and L = block length along d
        const ds = cells.map(c => dot(c, d));
        const L = (Math.max(...ds) - Math.min(...ds)) / 2 + 1;
        const nc = cells.map(c => { const k = N - dot(c, d); return add(add(c, d, k), n, k - 2 * L); });
        if (nc.some(c => occ.has(ck(c)))) return finish(cells, 'none');
        events.push({ t: 'roll', cells, n, d, L });
        const nn = d; d = n.map(x => -x); n = nn;
        cells = nc; rolled = true;
        continue;
      }
      const next = cells.map(c => add(c, d, 2));
      // cells ahead that are not part of this block
      if (next.some(c => occ.has(ck(c)))) return finish(cells, rolled ? 'roll' : moved ? 'slide' : 'none');
      events.push({ t: 'step', cells, n, d });
      cells = next; moved++;
    }
    return finish(cells, 'slide');
  }

  function key(state) {
    return state.map(cs => cs ? cs.map(ck).sort().join(';') : 'x').join('|');
  }

  function tangents(f) {
    const ax = Math.floor(f / 2), out = [];
    for (let a = 0; a < 3; a++) if (a !== ax) { const v = [0, 0, 0]; v[a] = 1; out.push(v, v.map(x => -x)); }
    return out;
  }

  function greedy(level, state0) {
    let state = state0.slice(); const path = [];
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < state.length && !changed; i++) {
        if (!state[i]) continue;
        for (const d of tangents(faceOf(state[i][0], level.n))) {
          const r = move(level, state, i, d);
          if (r.kind === 'exit') { state = r.state; path.push([i, d, 'exit', r.rolled]); changed = true; break; }
        }
      }
    }
    return { state, path };
  }

  // BFS for the fewest swipes. Returns {moves, path:[[i,d,kind]], rolls} or null (gave up) or {moves:-1}.
  function bfs(level, start, maxStates) {
    maxStates = maxStates || 200000;
    if (start.every(c => !c)) return { moves: 0, path: [] };
    const seen = new Map([[key(start), null]]);
    let frontier = [start], count = 1;
    while (frontier.length) {
      const next = [];
      for (const st of frontier) {
        const k0 = key(st), om = occMap(st);
        for (let i = 0; i < st.length; i++) {
          if (!st[i]) continue;
          for (const d of tangents(faceOf(st[i][0], level.n))) {
            const r = move(level, st, i, d, om);
            if (r.kind === 'none') continue;
            const k = key(r.state);
            if (seen.has(k)) continue;
            seen.set(k, [k0, i, d, r.kind, r.rolled]);
            if (r.state.every(c => !c)) {
              const path = []; let cur = k;
              while (seen.get(cur)) { const [pk, mi, md, kind, rl] = seen.get(cur); path.unshift([mi, md, kind, rl]); cur = pk; }
              return { moves: path.length, path, states: count };
            }
            next.push(r.state);
            if (++count > maxStates) return null;
          }
        }
      }
      frontier = next;
    }
    return { moves: -1, path: null, states: count };
  }

  function solve(level, state, maxStates) {
    const g = greedy(level, state);
    const r = bfs(level, g.state, maxStates);
    if (!r || r.moves < 0) return r;
    const path = g.path.concat(r.path);
    return { moves: path.length, path, states: r.states, rolls: path.filter(p => p[3]).length };
  }

  const api = { FACES, faceOf, faceIdx, axisOf, edgeKey, gateMap, move, key, tangents, greedy, bfs, solve, dot, add };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BE = api;
})(typeof window !== 'undefined' ? window : globalThis);
