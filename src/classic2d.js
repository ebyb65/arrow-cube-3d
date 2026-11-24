// Classic 2D mode for Arrow Cube 3D: the flat arrow puzzle on one grid.
// Tap an arrow to send it out in the direction its head points; it only escapes when
// nothing stands in its way. Every level is generated from its number and checked
// solvable before it is shown. No ads and no timers in this mode.
// Usage: Classic2D.open({ addCoins, sound, haptic, onClose }).
(function () {
  const SAVE_KEY = 'arrow_cube_2d_level';
  const WIN_COINS = 20;
  const MAX_HEARTS = 3;

  // ---------- Level generation (pure, testable) ----------
  function prng(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

  function levelSpec(n) {
    const size = Math.min(10, 4 + Math.floor((n + 1) / 3));   // 1:4x4, 2-4:5x5 ... up to 10x10
    const maxLen = Math.min(6, 3 + Math.floor(n / 6));
    return { size, minLen: 2, maxLen };
  }

  function headDir(path) {
    const a = path[path.length - 2], b = path[path.length - 1];
    return [b[0] - a[0], b[1] - a[1]];
  }

  // Cells on the ray from the head (exclusive) to the edge of the board.
  function rayCells(path, size) {
    const [dr, dc] = headDir(path);
    let [r, c] = path[path.length - 1];
    const out = [];
    for (;;) {
      r += dr; c += dc;
      if (r < 0 || c < 0 || r >= size || c >= size) return out;
      out.push([r, c]);
    }
  }

  function occupancy(arrows, size) {
    const occ = Array.from({ length: size }, () => Array(size).fill(-1));
    arrows.forEach((a, i) => { if (a) a.forEach(([r, c]) => { occ[r][c] = i; }); });
    return occ;
  }

  function blockerOf(arrows, i, size, occ) {
    occ = occ || occupancy(arrows, size);
    for (const [r, c] of rayCells(arrows[i], size)) if (occ[r][c] !== -1 && occ[r][c] !== i) return occ[r][c];
    return -1;
  }

  // Greedy removal; removing an arrow never blocks another, so this finds a solution if one exists.
  function solve(arrows, size) {
    const left = arrows.map(a => a);
    let remaining = left.filter(Boolean).length;
    const order = [];
    let progress = true;
    while (remaining > 0 && progress) {
      progress = false;
      const occ = occupancy(left, size);
      for (let i = 0; i < left.length; i++) {
        if (left[i] && blockerOf(left, i, size, occ) === -1) {
          left[i] = null; remaining--; order.push(i); progress = true;
          break;
        }
      }
    }
    return { solved: remaining === 0, order, stuck: left.map((a, i) => (a ? i : -1)).filter(i => i >= 0) };
  }

  function fillPaths(size, rnd, minLen, maxLen) {
    const used = Array.from({ length: size }, () => Array(size).fill(false));
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    const paths = [];
    const free = () => { const l = []; for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!used[r][c]) l.push([r, c]); return l; };
    for (let tries = 0; tries < 400; tries++) {
      const cells = free();
      if (cells.length < 2) break;
      const start = cells[Math.floor(rnd() * cells.length)];
      const target = minLen + Math.floor(rnd() * (maxLen - minLen + 1));
      const path = [start]; used[start[0]][start[1]] = true;
      let last = null;
      while (path.length < target) {
        const [r, c] = path[path.length - 1];
        const ok = dirs.filter(([dr, dc]) => { const nr = r + dr, nc = c + dc; return nr >= 0 && nc >= 0 && nr < size && nc < size && !used[nr][nc]; });
        if (!ok.length) break;
        const keep = last && ok.find(d => d[0] === last[0] && d[1] === last[1]);
        const d = keep && rnd() < 0.55 ? keep : ok[Math.floor(rnd() * ok.length)];
        const nr = r + d[0], nc = c + d[1];
        used[nr][nc] = true; path.push([nr, nc]); last = d;
      }
      if (path.length >= 2) { if (rnd() < 0.5) path.reverse(); paths.push(path); }
      else used[start[0]][start[1]] = false;
    }
    return paths;
  }

  // Builds a few candidates and keeps the fullest board, so repairs never leave it sparse.
  function generate(n) {
    let best = null;
    for (let k = 0; k < 4; k++) {
      const b = generateOnce(n, k);
      const cells = b.arrows.reduce((t, a) => t + a.length, 0);
      if (!best || cells > best.cells) best = { cells, b };
      if (cells >= b.size * b.size * 0.85) break;
    }
    return best.b;
  }

  function generateOnce(n, variant) {
    const spec = levelSpec(n);
    const rnd = prng(n * 7919 + 4242 + variant * 104729);
    let arrows = fillPaths(spec.size, rnd, spec.minLen, spec.maxLen);
    // Repair until solvable: flip a stuck arrow, and if that doesn't help, drop it.
    for (let guard = 0; guard < 500; guard++) {
      const res = solve(arrows, spec.size);
      if (res.solved) break;
      const i = res.stuck[Math.floor(rnd() * res.stuck.length)];
      const flipped = arrows.slice(); flipped[i] = arrows[i].slice().reverse();
      if (solve(flipped, spec.size).stuck.length < res.stuck.length) arrows = flipped;
      else arrows = arrows.filter((_, k) => k !== i);
    }
    return { size: spec.size, arrows };
  }

  // ---------- UI ----------
  const COLORS = ['#0f172a', '#4338ca', '#0369a1', '#7c3aed', '#be185d', '#047857', '#b45309'];
  let root, canvas, ctx, ui = {}, opts = {};
  let level = 1, board = null, alive = [], hearts = MAX_HEARTS, mistakes = 0;
  let anims = [], raf = 0, busy = false;

  function css() {
    const s = document.createElement('style');
    s.textContent = `
#c2d{position:fixed;inset:0;z-index:55;display:flex;flex-direction:column;align-items:center;
  background:linear-gradient(#f0f9ff,#e0e7ff);font-family:Inter,system-ui,sans-serif;color:#0f172a;
  padding:calc(env(safe-area-inset-top) + 12px) 16px calc(env(safe-area-inset-bottom) + 64px);box-sizing:border-box;overflow:hidden}
#c2d.hidden{display:none}
#c2d .bar{width:100%;max-width:460px;display:flex;align-items:center;justify-content:space-between;gap:8px}
#c2d button{font:inherit;border:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
#c2d .pill{background:#fff;border:1px solid #c7d2fe;border-radius:14px;padding:8px 12px;font-weight:800;font-size:13px;color:#3730a3}
#c2d .title{text-align:center;margin:10px 0 4px}
#c2d .title b{display:block;font-family:Fredoka,Inter,sans-serif;font-size:22px}
#c2d .title span{font-size:12px;color:#64748b;font-weight:700}
#c2d .stage{flex:1;width:100%;display:flex;align-items:center;justify-content:center;min-height:0}
#c2d canvas{touch-action:manipulation;border-radius:20px;background:#fff;box-shadow:0 10px 30px rgba(67,56,202,.15)}
#c2d .msg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.55);padding:16px}
#c2d .msg.hidden{display:none}
#c2d .card{background:#fff;border-radius:24px;padding:24px;max-width:320px;width:100%;text-align:center}
#c2d .card h3{font-family:Fredoka,Inter,sans-serif;font-size:24px;margin:0 0 6px}
#c2d .card p{font-size:13px;color:#475569;margin:0 0 16px}
#c2d .go{width:100%;padding:14px;border-radius:16px;color:#fff;font-weight:800;font-size:15px;background:linear-gradient(90deg,#0ea5e9,#4f46e5)}
#c2d .ghost{width:100%;padding:10px;margin-top:8px;border-radius:14px;background:#eef2ff;color:#3730a3;font-weight:800;font-size:13px}`;
    document.head.appendChild(s);
  }

  function build() {
    css();
    root = document.createElement('div');
    root.id = 'c2d';
    root.className = 'hidden';
    root.innerHTML = `
      <div class="bar">
        <button class="pill" data-a="back" aria-label="Back to home">← Home</button>
        <span class="pill" id="c2d-hearts" aria-label="Hearts">❤️ 3/3</span>
        <button class="pill" data-a="restart" aria-label="Restart level">↻ Restart</button>
      </div>
      <div class="title"><b>Classic 2D · Level <span id="c2d-level" style="font-size:22px;color:inherit">1</span></b>
        <span id="c2d-left">Tap an arrow to send it off the board</span></div>
      <div class="stage"><canvas id="c2d-canvas"></canvas></div>
      <div class="msg hidden" id="c2d-msg"><div class="card">
        <h3 id="c2d-msg-title"></h3><p id="c2d-msg-text"></p>
        <button class="go" id="c2d-msg-go"></button>
        <button class="ghost" data-a="back">Home</button>
      </div></div>`;
    document.body.appendChild(root);
    canvas = root.querySelector('canvas');
    ctx = canvas.getContext('2d');
    ui.hearts = root.querySelector('#c2d-hearts');
    ui.level = root.querySelector('#c2d-level');
    ui.left = root.querySelector('#c2d-left');
    ui.msg = root.querySelector('#c2d-msg');
    ui.msgTitle = root.querySelector('#c2d-msg-title');
    ui.msgText = root.querySelector('#c2d-msg-text');
    ui.msgGo = root.querySelector('#c2d-msg-go');
    root.addEventListener('click', e => {
      const a = e.target.closest('[data-a]');
      if (!a) return;
      if (a.dataset.a === 'back') close();
      if (a.dataset.a === 'restart') start(level);
    });
    ui.msgGo.addEventListener('click', () => start(ui.msgGo.dataset.next === '1' ? level + 1 : level));
    canvas.addEventListener('pointerdown', onTap);
    window.addEventListener('resize', () => { if (!root.classList.contains('hidden')) { layout(); draw(); } });
  }

  let cell = 40, pad = 14, dpr = 1;
  function layout() {
    const stage = root.querySelector('.stage');
    const avail = Math.max(200, Math.min(stage.clientWidth, stage.clientHeight, 460));
    cell = Math.floor((avail - pad * 2) / board.size);
    const px = cell * board.size + pad * 2;
    dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.style.width = px + 'px'; canvas.style.height = px + 'px';
    canvas.width = Math.round(px * dpr); canvas.height = Math.round(px * dpr);
  }

  const center = ([r, c]) => [pad + c * cell + cell / 2, pad + r * cell + cell / 2];

  function drawArrow(path, color, ox, oy, alpha) {
    const pts = path.map(center).map(([x, y]) => [x + ox, y + oy]);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = Math.max(4, cell * 0.2); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    const [dr, dc] = headDir(path);
    const [hx, hy] = pts[pts.length - 1];
    const s = cell * 0.34, ang = Math.atan2(dr, dc);
    ctx.beginPath();
    ctx.moveTo(hx + Math.cos(ang) * s, hy + Math.sin(ang) * s);
    ctx.lineTo(hx + Math.cos(ang + 2.4) * s, hy + Math.sin(ang + 2.4) * s);
    ctx.lineTo(hx + Math.cos(ang - 2.4) * s, hy + Math.sin(ang - 2.4) * s);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], ctx.lineWidth * 0.75, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#cbd5e1';
    for (let r = 0; r < board.size; r++) for (let c = 0; c < board.size; c++) {
      const [x, y] = center([r, c]); ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
    now = now || performance.now();
    alive.forEach((a, i) => {
      if (!a) return;
      const an = anims.find(m => m.i === i);
      let ox = 0, oy = 0, alpha = 1, color = COLORS[i % COLORS.length];
      if (an) {
        const t = Math.min(1, (now - an.t0) / an.dur);
        const [dr, dc] = headDir(a);
        if (an.kind === 'out') { const d = t * t * cell * (board.size + 2); ox = dc * d; oy = dr * d; alpha = 1 - t; }
        else { const d = Math.sin(t * Math.PI) * cell * 0.3; ox = dc * d; oy = dr * d; color = '#e11d48'; }
      }
      drawArrow(a, color, ox, oy, alpha);
    });
  }

  function loop(now) {
    anims = anims.filter(an => {
      if (now - an.t0 < an.dur) return true;
      if (an.kind === 'out') { alive[an.i] = null; afterEscape(); }
      return false;
    });
    draw(now);
    raf = anims.length ? requestAnimationFrame(loop) : 0;
  }
  function animate(i, kind, dur) {
    anims.push({ i, kind, dur, t0: performance.now() });
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function remaining() { return alive.filter(Boolean).length; }
  function refresh() {
    ui.hearts.textContent = `❤️ ${hearts}/${MAX_HEARTS}`;
    const n = remaining();
    const tip = level <= 2 && mistakes + (board.arrows.length - n) < 3 ? ' · tap an arrow with a clear path' : '';
    ui.left.textContent = n ? `${n} arrow${n === 1 ? '' : 's'} left${tip}` : 'Board clear!';
  }

  function onTap(e) {
    if (busy) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - pad, y = e.clientY - rect.top - pad;
    const c = Math.floor(x / cell), r = Math.floor(y / cell);
    if (r < 0 || c < 0 || r >= board.size || c >= board.size) return;
    const occ = occupancy(alive, board.size);
    const i = occ[r][c];
    if (i < 0 || anims.some(m => m.i === i)) return;
    // Arrows already flying out don't block.
    const flying = new Set(anims.filter(m => m.kind === 'out').map(m => m.i));
    const view = alive.map((a, k) => (flying.has(k) ? null : a));
    const b = blockerOf(view, i, board.size);
    if (b === -1) {
      fx('sound', 'ok'); fx('haptic', 'light');
      animate(i, 'out', 320);
      refresh();
    } else {
      mistakes++; hearts--;
      fx('sound', 'bump'); fx('haptic', 'error');
      animate(i, 'bump', 260);
      refresh();
      if (hearts <= 0) {
        busy = true;
        setTimeout(() => show('Out of hearts', 'That arrow was blocked. Try the level again, as often as you like.', 'Try again', false), 450);
      }
    }
  }

  function afterEscape() {
    refresh();
    if (remaining() === 0 && !busy) {
      busy = true;
      const best = level >= savedLevel();
      if (best) { try { localStorage.setItem(SAVE_KEY, String(level + 1)); } catch (e) {} }
      if (opts.addCoins) { try { opts.addCoins(WIN_COINS); } catch (e) {} }
      fx('sound', 'win'); fx('haptic', 'win');
      const stars = mistakes === 0 ? '★★★' : mistakes === 1 ? '★★☆' : '★☆☆';
      setTimeout(() => show(`Level ${level} clear! ${stars}`, `+${WIN_COINS} coins 🪙`, 'Next level →', true), 300);
    }
  }

  function show(title, text, go, next) {
    ui.msgTitle.textContent = title; ui.msgText.textContent = text;
    ui.msgGo.textContent = go; ui.msgGo.dataset.next = next ? '1' : '0';
    ui.msg.classList.remove('hidden');
  }

  function fx(kind, v) { try { if (opts[kind]) opts[kind](v); } catch (e) {} }

  function savedLevel() {
    try { const n = parseInt(localStorage.getItem(SAVE_KEY), 10); return n > 0 ? n : 1; } catch (e) { return 1; }
  }

  function start(n) {
    level = n; board = generate(n); alive = board.arrows.slice();
    hearts = MAX_HEARTS; mistakes = 0; anims = []; busy = false;
    ui.level.textContent = n;
    ui.msg.classList.add('hidden');
    layout(); refresh(); draw();
  }

  function open(o) {
    opts = o || {};
    if (!root) build();
    root.classList.remove('hidden');
    start(savedLevel());
  }

  function close() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; anims = [];
    root.classList.add('hidden');
    if (opts.onClose) try { opts.onClose(); } catch (e) {}
  }

  window.Classic2D = { open, close, savedLevel, _gen: { generate, solve, levelSpec } };
})();
