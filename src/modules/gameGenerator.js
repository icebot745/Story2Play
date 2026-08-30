import { buildDefaultMovements } from './gameDefinitionBuilder.js'

const ROLE_COLOR = {
  player:      '#4caf50',
  enemy:       '#f44336',
  collectible: '#ffc107',
  obstacle:    '#795548',
}

export function generateGame(gameSpec) {
  const { background, elements = [], winCondition = {}, rules = {} } = gameSpec
  let { movements = [] } = gameSpec

  if (movements.length === 0 && elements.length > 0) {
    movements = buildDefaultMovements(elements)
  }

  const safeRules = {
    scoring:             rules.scoring             ?? false,
    pointsPerCollectible:rules.pointsPerCollectible ?? 10,
    lives:               rules.lives               ?? 3,
    timeLimit:           rules.timeLimit            ?? null,
  }

  const gameData = JSON.stringify({ elements, movements, winCondition, rules: safeRules })
  const bgSrc    = JSON.stringify(background ?? '')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>My Story2Play Game</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#111;display:flex;flex-direction:column;align-items:center;
     justify-content:center;height:100vh;overflow:hidden;
     font-family:system-ui,sans-serif;touch-action:none}
canvas{display:block;border:3px solid #333;max-width:100vw;max-height:80vh}
#hud{position:fixed;top:0;left:0;right:0;padding:.4rem 1rem;
     display:flex;justify-content:space-between;align-items:center;
     background:rgba(0,0,0,.55);color:#fff;font-size:1.1rem;font-weight:700;z-index:10}
#controls{position:fixed;bottom:.75rem;left:50%;transform:translateX(-50%);
          display:grid;grid-template-columns:repeat(3,3.2rem);
          grid-template-rows:repeat(2,3.2rem);gap:.3rem;z-index:10}
.cb{width:3.2rem;height:3.2rem;border-radius:.5rem;border:none;
    background:rgba(255,255,255,.22);color:#fff;font-size:1.4rem;
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    user-select:none;-webkit-user-select:none}
.cb:active{background:rgba(255,255,255,.45)}
#overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);
         display:flex;flex-direction:column;align-items:center;
         justify-content:center;color:#fff;text-align:center;z-index:20;padding:1rem}
#overlay.hidden{display:none}
#overlay h1{font-size:3rem;margin-bottom:.4rem}
#overlay h2{font-size:1.6rem;margin-bottom:.4rem}
#overlay p{font-size:1.1rem;margin-bottom:1.5rem;color:#ccc}
#overlay button{padding:.75rem 2.25rem;font-size:1.1rem;font-weight:700;
                background:#6c63ff;color:#fff;border:none;
                border-radius:2rem;cursor:pointer}
</style>
</head>
<body>
<div id="hud">
  <span id="h-lives"></span>
  <span id="h-score"></span>
  <span id="h-timer"></span>
</div>
<canvas id="game"></canvas>
<div id="controls">
  <div></div><button class="cb" id="bu">▲</button><div></div>
  <button class="cb" id="bl">◄</button>
  <button class="cb" id="bd">▼</button>
  <button class="cb" id="br">►</button>
</div>
<div id="overlay" class="hidden">
  <h1 id="o-emoji"></h1>
  <h2 id="o-title"></h2>
  <p  id="o-msg"></p>
  <button onclick="restart()">Play Again! 🎮</button>
</div>
<script>
const DATA   = ${gameData};
const BG_SRC = ${bgSrc};
const COLORS = ${JSON.stringify(ROLE_COLOR)};

const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');
const LW = 800, LH = 500;

function resize() {
  const s = Math.min(window.innerWidth / LW, (window.innerHeight - 110) / LH);
  canvas.style.width  = (LW * s) + 'px';
  canvas.style.height = (LH * s) + 'px';
  canvas.width  = LW;
  canvas.height = LH;
}
resize();
window.addEventListener('resize', resize);

const bgImg = new Image();
bgImg.src = BG_SRC;

const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true;  e.preventDefault(); });
window.addEventListener('keyup',   e => { keys[e.key] = false; });

function bindBtn(id, key) {
  const b = document.getElementById(id);
  if (!b) return;
  const on  = e => { e.preventDefault(); keys[key] = true; };
  const off = e => { e.preventDefault(); keys[key] = false; };
  b.addEventListener('touchstart', on,  { passive: false });
  b.addEventListener('touchend',   off, { passive: false });
  b.addEventListener('mousedown',  on);
  b.addEventListener('mouseup',    off);
}
bindBtn('bu','ArrowUp'); bindBtn('bd','ArrowDown');
bindBtn('bl','ArrowLeft'); bindBtn('br','ArrowRight');

let state;

function buildState() {
  const entities = DATA.elements.map(el => {
    const mv = DATA.movements.find(m => m.elementId === el.id) || { type:'stationary', speed:3 };
    return {
      id: el.id, name: el.name, role: el.role,
      x: el.x * LW,  y: el.y * LH,
      w: Math.max(el.w * LW, 24), h: Math.max(el.h * LH, 24),
      moveType: mv.type,
      speed: mv.speed * 55,
      vx: mv.type === 'auto-patrol' ? mv.speed * 55 : 0,
      vy: 0,
      alive: true, collected: false,
    };
  });
  const wt = DATA.winCondition.type;
  const timerStart =
    wt === 'survive-timer'  ? (DATA.winCondition.duration ?? 30) :
    DATA.rules.timeLimit    ? DATA.rules.timeLimit :
    null;
  return { entities, lives: DATA.rules.lives, score: 0, timer: timerStart, phase: 'playing', invincible: 0 };
}

function restart() {
  state = buildState();
  document.getElementById('overlay').classList.add('hidden');
  lastTs = null;
}
restart();

function overlaps(a, b) {
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}
function player() { return state.entities.find(e => e.role === 'player'); }

let lastTs = null;

function update(ts) {
  if (!lastTs) lastTs = ts;
  const dt = Math.min((ts - lastTs) / 1000, 0.05);
  lastTs = ts;
  if (state.phase !== 'playing') return;
  const pl = player();
  if (pl && pl.moveType === 'arrow-keys') {
    let vx = 0, vy = 0;
    if (keys['ArrowLeft']  || keys['a']) vx = -pl.speed;
    if (keys['ArrowRight'] || keys['d']) vx =  pl.speed;
    if (keys['ArrowUp']    || keys['w']) vy = -pl.speed;
    if (keys['ArrowDown']  || keys['s']) vy =  pl.speed;
    pl.x = Math.max(0, Math.min(LW - pl.w, pl.x + vx * dt));
    pl.y = Math.max(0, Math.min(LH - pl.h, pl.y + vy * dt));
  }
  state.entities.filter(e => e.role === 'enemy' && e.alive).forEach(en => {
    if (en.moveType === 'auto-patrol') {
      en.x += en.vx * dt;
      if (en.x <= 0 || en.x + en.w >= LW) en.vx *= -1;
      en.x = Math.max(0, Math.min(LW - en.w, en.x));
    } else if (en.moveType === 'follows-player' && pl) {
      const dx = (pl.x + pl.w/2) - (en.x + en.w/2);
      const dy = (pl.y + pl.h/2) - (en.y + en.h/2);
      const d  = Math.sqrt(dx*dx + dy*dy) || 1;
      en.x += (dx/d) * en.speed * dt;
      en.y += (dy/d) * en.speed * dt;
    }
  });
  if (state.invincible > 0) state.invincible -= dt;
  if (state.timer !== null) state.timer = Math.max(0, state.timer - dt);
  if (pl) {
    state.entities.forEach(en => {
      if (!en.alive || en.role === 'player' || !overlaps(pl, en)) return;
      if (en.role === 'collectible' && !en.collected) {
        en.collected = true; en.alive = false;
        if (DATA.rules.scoring) state.score += DATA.rules.pointsPerCollectible;
      }
      if (en.role === 'enemy' && state.invincible <= 0) {
        if (DATA.winCondition.type === 'defeat-all-enemies') { en.alive = false; }
        else { state.lives--; state.invincible = 2; if (state.lives <= 0) { state.phase='lost'; showOverlay('lost'); } }
      }
      if (en.role === 'obstacle') {
        const ox = (pl.x + pl.w/2) - (en.x + en.w/2);
        const oy = (pl.y + pl.h/2) - (en.y + en.h/2);
        if (Math.abs(ox) > Math.abs(oy)) pl.x += ox > 0 ? 2 : -2;
        else pl.y += oy > 0 ? 2 : -2;
      }
    });
  }
  checkWin();
  updateHUD();
}

function checkWin() {
  if (state.phase !== 'playing') return;
  const pl = player();
  const wt = DATA.winCondition.type;
  const ents = state.entities;
  if (wt === 'collect-all') {
    const cols = ents.filter(e => e.role === 'collectible');
    if (cols.length && cols.every(c => c.collected)) { state.phase='won'; showOverlay('won'); }
  } else if (wt === 'defeat-all-enemies') {
    const enems = ents.filter(e => e.role === 'enemy');
    if (enems.length && enems.every(e => !e.alive)) { state.phase='won'; showOverlay('won'); }
  } else if (wt === 'reach-goal' && pl) {
    const goal = ents.find(e => e.id === DATA.winCondition.target);
    if (goal && overlaps(pl, goal)) { state.phase='won'; showOverlay('won'); }
  } else if (wt === 'survive-timer') {
    if (state.timer !== null && state.timer <= 0) { state.phase='won'; showOverlay('won'); }
  }
  if (wt !== 'survive-timer' && state.timer !== null && state.timer <= 0 && state.phase === 'playing') {
    state.phase = 'lost'; showOverlay('lost');
  }
}

function updateHUD() {
  document.getElementById('h-lives').textContent = '❤️'.repeat(Math.max(0, state.lives));
  document.getElementById('h-score').textContent = DATA.rules.scoring ? '⭐ ' + state.score : '';
  document.getElementById('h-timer').textContent = state.timer !== null ? '⏱️ ' + Math.ceil(state.timer) + 's' : '';
}

function showOverlay(result) {
  document.getElementById('o-emoji').textContent = result === 'won' ? '🎉' : '😢';
  document.getElementById('o-title').textContent = result === 'won' ? 'You Won!'   : 'Game Over';
  document.getElementById('o-msg').textContent   = result === 'won'
    ? (DATA.rules.scoring ? 'Score: ' + state.score : 'Amazing job!')
    : 'Better luck next time!';
  document.getElementById('overlay').classList.remove('hidden');
}

function draw() {
  ctx.clearRect(0, 0, LW, LH);
  if (bgImg.complete && bgImg.naturalWidth > 0) {
    ctx.drawImage(bgImg, 0, 0, LW, LH);
  } else {
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, LW, LH);
  }
  state.entities.forEach(en => {
    if (!en.alive) return;
    if (en.role === 'player' && state.invincible > 0 && Math.floor(state.invincible * 10) % 2 === 0) return;
    const c = COLORS[en.role] || '#888';
    ctx.fillStyle   = c + 'bb';
    ctx.strokeStyle = c;
    ctx.lineWidth   = 3;
    ctx.fillRect  (en.x, en.y, en.w, en.h);
    ctx.strokeRect(en.x, en.y, en.w, en.h);
    ctx.fillStyle   = '#fff';
    ctx.font        = 'bold 13px sans-serif';
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText(en.name, en.x + en.w/2, en.y + en.h/2);
  });
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

function loop(ts) { update(ts); draw(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
<\/script>
</body>
</html>`
}
