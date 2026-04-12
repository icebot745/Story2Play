/**
 * generateGame(gameSpec) → self-contained HTML string
 *
 * Takes the completed GameSpec and produces a single .html file that runs
 * the game in any browser with no external dependencies.
 */
export function generateGame(gameSpec) {
  const specJson = JSON.stringify(gameSpec)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Game</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #1a1a2e;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: 'Comic Sans MS', 'Chalkboard SE', cursive;
      overflow: hidden;
    }
    #game-wrap { position: relative; display: inline-block; }
    canvas { display: block; border: 3px solid rgba(255,255,255,0.3); border-radius: 8px; }
    #hud {
      position: absolute; top: 8px; left: 0; right: 0;
      display: flex; justify-content: space-between; padding: 0 12px;
      pointer-events: none; font-size: 18px; font-weight: bold;
      color: #fff; text-shadow: 1px 1px 3px #000;
    }
    #overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.75);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: #fff; text-align: center; border-radius: 5px;
    }
    #overlay h1 { font-size: 3rem; margin-bottom: 0.5rem; }
    #overlay p  { font-size: 1.2rem; margin-bottom: 1.5rem; }
    #overlay button {
      font-size: 1.1rem; padding: 0.75rem 2rem;
      border: none; border-radius: 2rem;
      background: #6c63ff; color: #fff; cursor: pointer;
      font-family: inherit; transition: background 0.15s;
    }
    #overlay button:hover { background: #5a52e0; }
    #overlay.hidden { display: none; }
    #dpad {
      display: none;
      position: fixed; bottom: 20px; left: 20px;
      gap: 4px;
      grid-template-columns: repeat(3, 52px);
      grid-template-rows: repeat(3, 52px);
    }
    @media (pointer: coarse) { #dpad { display: grid; } }
    .dpad-btn {
      background: rgba(255,255,255,0.25);
      border: 2px solid rgba(255,255,255,0.45);
      border-radius: 10px; color: #fff; font-size: 1.3rem;
      cursor: pointer; user-select: none;
      display: flex; align-items: center; justify-content: center;
      -webkit-tap-highlight-color: transparent;
    }
    .dpad-btn:active { background: rgba(255,255,255,0.55); }
  </style>
</head>
<body>
  <div id="game-wrap">
    <canvas id="game"></canvas>
    <div id="hud">
      <span id="score-el"></span>
      <span id="timer-el"></span>
      <span id="lives-el"></span>
    </div>
    <div id="overlay" class="hidden">
      <h1 id="overlay-title"></h1>
      <p  id="overlay-msg"></p>
      <button id="restart-btn">Play Again 🎮</button>
    </div>
  </div>

  <div id="dpad">
    <div></div>
    <button class="dpad-btn" id="btn-up">▲</button>
    <div></div>
    <button class="dpad-btn" id="btn-left">◀</button>
    <div></div>
    <button class="dpad-btn" id="btn-right">▶</button>
    <div></div>
    <button class="dpad-btn" id="btn-down">▼</button>
    <div></div>
  </div>

  <script>
${buildGameScript(specJson)}
  </script>
</body>
</html>`
}

function buildGameScript(specJson) {
  return `(function () {
  var SPEC = ${specJson};

  // Canvas + sizing
  var canvas = document.getElementById('game');
  var ctx    = canvas.getContext('2d');

  var bgImg = new Image();
  bgImg.onload  = function () { initCanvas(bgImg.naturalWidth, bgImg.naturalHeight); };
  bgImg.onerror = function () { initCanvas(800, 500); };
  if (SPEC.background) {
    bgImg.src = SPEC.background;
  } else {
    initCanvas(800, 500);
  }

  function initCanvas(imgW, imgH) {
    var maxW = Math.min(window.innerWidth  - 16, 840);
    var maxH = Math.min(window.innerHeight - 20, 560);
    var ratio = imgW / imgH;
    var W = maxW, H = maxW / ratio;
    if (H > maxH) { H = maxH; W = maxH * ratio; }
    W = Math.floor(W); H = Math.floor(H);
    canvas.width  = W;
    canvas.height = H;
    startGame(W, H);
  }

  function startGame(W, H) {
    // Build movement lookup
    var mvMap = {};
    (SPEC.movements || []).forEach(function (m) { mvMap[m.elementId] = m; });

    // Build entities
    var entities = (SPEC.elements || []).map(function (el) {
      var mv = mvMap[el.id] || { type: 'stationary', speed: 3 };
      return {
        id:         el.id,
        name:       el.name,
        role:       el.role,
        subtype:    el.subtype || null,
        x:          el.x * W,
        y:          el.y * H,
        w:          Math.max(el.w * W, 18),
        h:          Math.max(el.h * H, 18),
        startX:     el.x * W,
        startY:     el.y * H,
        vx: 0, vy: 0,
        alive:      true,
        patrolDir:  1,
        mvType:     mv.type,
        speed:      mv.speed || 3,
      };
    });

    var player    = entities.find(function (e) { return e.role === 'player'; });
    var winType   = (SPEC.winCondition  || {}).type;
    var winTarget = (SPEC.winCondition  || {}).target;
    var scoring   = (SPEC.rules || {}).scoring           || false;
    var pointsEa  = (SPEC.rules || {}).pointsPerCollectible || 10;
    var startLives= (SPEC.rules || {}).lives             || 3;
    var timeLimit = (SPEC.rules || {}).timeLimit         || null;  // seconds or null

    // Game state
    var score = 0, lives = startLives;
    var timeLeft    = timeLimit ? timeLimit * 1000 : null;  // ms
    var gameOver    = false, won = false;
    var invincibleMs= 0;

    // Input
    var keys = {};
    window.addEventListener('keydown', function (e) {
      keys[e.key] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key) !== -1) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', function (e) { keys[e.key] = false; });

    function bindDpad(id, key) {
      var btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart',  function (e) { keys[key] = true;  e.preventDefault(); }, { passive: false });
      btn.addEventListener('touchend',    function (e) { keys[key] = false; e.preventDefault(); }, { passive: false });
      btn.addEventListener('touchcancel', function (e) { keys[key] = false; e.preventDefault(); }, { passive: false });
      btn.addEventListener('mousedown',   function ()  { keys[key] = true;  });
      btn.addEventListener('mouseup',     function ()  { keys[key] = false; });
    }
    bindDpad('btn-up',    'ArrowUp');
    bindDpad('btn-down',  'ArrowDown');
    bindDpad('btn-left',  'ArrowLeft');
    bindDpad('btn-right', 'ArrowRight');

    // HUD elements
    var scoreEl   = document.getElementById('score-el');
    var livesEl   = document.getElementById('lives-el');
    var timerEl   = document.getElementById('timer-el');
    var overlay   = document.getElementById('overlay');
    var oTitle    = document.getElementById('overlay-title');
    var oMsg      = document.getElementById('overlay-msg');
    var restartBtn= document.getElementById('restart-btn');

    function updateHUD() {
      if (scoring) scoreEl.textContent = '⭐ ' + score;
      livesEl.textContent = '❤️ '.repeat(Math.max(0, lives));
      if (timeLeft !== null) {
        var secs = Math.ceil(timeLeft / 1000);
        timerEl.textContent = '⏱ ' + secs + 's';
      }
    }

    function showOverlay(title, msg) {
      oTitle.textContent = title;
      oMsg.textContent   = msg;
      overlay.classList.remove('hidden');
    }

    restartBtn.addEventListener('click', function () {
      overlay.classList.add('hidden');
      resetGame();
    });

    function resetGame() {
      score = 0; lives = startLives;
      timeLeft     = timeLimit ? timeLimit * 1000 : null;
      gameOver     = false; won = false;
      invincibleMs = 0;
      entities.forEach(function (e) {
        e.x = e.startX; e.y = e.startY;
        e.vx = 0; e.vy = 0;
        e.alive = true; e.patrolDir = 1;
      });
    }

    // Collision helpers
    function overlaps(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x &&
             a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function resolveOverlap(mover, blocker) {
      var ox = Math.min(mover.x + mover.w, blocker.x + blocker.w) - Math.max(mover.x, blocker.x);
      var oy = Math.min(mover.y + mover.h, blocker.y + blocker.h) - Math.max(mover.y, blocker.y);
      if (ox < oy) {
        mover.x += (mover.x < blocker.x) ? -ox : ox;
      } else {
        mover.y += (mover.y < blocker.y) ? -oy : oy;
      }
    }

    function checkWin() {
      if (!player || !player.alive) return false;
      if (winType === 'collect-all') {
        return entities.filter(function (e) { return e.role === 'collectible'; })
                       .every(function (e) { return !e.alive; });
      }
      if (winType === 'reach-goal') {
        var goal = entities.find(function (e) { return e.id === winTarget; }) ||
                   entities.find(function (e) { return e.role === 'collectible'; });
        return !!goal && overlaps(player, goal);
      }
      if (winType === 'defeat-all-enemies') {
        return entities.filter(function (e) { return e.role === 'enemy'; })
                       .every(function (e) { return !e.alive; });
      }
      if (winType === 'survive-timer') {
        return timeLeft !== null && timeLeft <= 0 && lives > 0;
      }
      return false;
    }

    // Update
    function update(dt) {
      var ms = dt * 1000;
      if (invincibleMs > 0) invincibleMs -= ms;
      if (timeLeft    !== null) timeLeft -= ms;

      entities.forEach(function (e) {
        if (!e.alive) return;
        e.vx = 0; e.vy = 0;

        if (e.mvType === 'arrow-keys' && e === player) {
          var spd = e.speed * 60 * dt;
          if (keys['ArrowLeft']  || keys['a'] || keys['A']) e.vx = -spd;
          if (keys['ArrowRight'] || keys['d'] || keys['D']) e.vx =  spd;
          if (keys['ArrowUp']    || keys['w'] || keys['W']) e.vy = -spd;
          if (keys['ArrowDown']  || keys['s'] || keys['S']) e.vy =  spd;

        } else if (e.mvType === 'auto-patrol') {
          var spd = e.speed * 60 * dt;
          e.vx = spd * e.patrolDir;
          if (e.x <= 0)        { e.patrolDir =  1; e.x = 0; }
          if (e.x + e.w >= W)  { e.patrolDir = -1; e.x = W - e.w; }

        } else if (e.mvType === 'follows-player' && player && player.alive) {
          var spd  = e.speed * 60 * dt;
          var dx   = (player.x + player.w / 2) - (e.x + e.w / 2);
          var dy   = (player.y + player.h / 2) - (e.y + e.h / 2);
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          e.vx = (dx / dist) * spd;
          e.vy = (dy / dist) * spd;
        }

        e.x += e.vx;
        e.y += e.vy;
        e.x = Math.max(0, Math.min(W - e.w, e.x));
        e.y = Math.max(0, Math.min(H - e.h, e.y));
      });

      // Collisions with player
      if (player && player.alive) {
        entities.forEach(function (e) {
          if (!e.alive || e === player) return;
          if (!overlaps(player, e)) return;

          if (e.role === 'collectible') {
            e.alive = false;
            if (scoring) score += pointsEa;

          } else if (e.role === 'enemy') {
            if (winType === 'defeat-all-enemies') {
              // In defeat-enemies mode touching an enemy defeats it
              e.alive = false;
              if (scoring) score += pointsEa;
            } else {
              if (invincibleMs <= 0) {
                lives--;
                invincibleMs = 1500;
                // Bounce player away from enemy
                var dx = (player.x + player.w / 2) - (e.x + e.w / 2);
                var dy = (player.y + player.h / 2) - (e.y + e.h / 2);
                var dist = Math.sqrt(dx * dx + dy * dy) || 1;
                player.x += (dx / dist) * 32;
                player.y += (dy / dist) * 32;
                player.x = Math.max(0, Math.min(W - player.w, player.x));
                player.y = Math.max(0, Math.min(H - player.h, player.y));
              }
            }

          } else if (e.role === 'obstacle') {
            resolveOverlap(player, e);
          }
        });
      }

      // Check win / loss
      if (checkWin()) {
        won = true;
        showOverlay('You Win! 🎉', scoring ? 'Score: ' + score : 'Amazing job!');
      } else if (lives <= 0) {
        gameOver = true;
        showOverlay('Game Over 😢', 'Better luck next time!');
      } else if (timeLeft !== null && timeLeft <= 0 && winType !== 'survive-timer') {
        gameOver = true;
        showOverlay("Time's Up! ⏰", 'Try again!');
      }
    }

    // ── Drawing functions ──────────────────────────────

    function drawStickman(x, y, w, h, color) {
      ctx.save();
      var lw = Math.max(2, Math.min(4, w * 0.09));
      ctx.strokeStyle = color;
      ctx.fillStyle   = color;
      ctx.lineWidth   = lw;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';

      var cx     = x + w / 2;
      var headR  = Math.max(4, Math.min(w * 0.22, h * 0.2));
      var headCy = y + headR + lw;

      // Head
      ctx.beginPath();
      ctx.arc(cx, headCy, headR, 0, Math.PI * 2);
      ctx.fill();

      // Body
      var neckY  = headCy + headR;
      var waistY = y + h * 0.68;
      ctx.beginPath();
      ctx.moveTo(cx, neckY);
      ctx.lineTo(cx, waistY);
      ctx.stroke();

      // Arms
      var armY = y + h * 0.40;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.1, armY + h * 0.09);
      ctx.lineTo(cx, armY);
      ctx.lineTo(x + w * 0.9, armY + h * 0.09);
      ctx.stroke();

      // Legs
      ctx.beginPath();
      ctx.moveTo(cx, waistY);
      ctx.lineTo(x + w * 0.18, y + h - lw);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, waistY);
      ctx.lineTo(x + w * 0.82, y + h - lw);
      ctx.stroke();

      ctx.restore();
    }

    function drawCoin(x, y, w, h) {
      var cx = x + w / 2;
      var cy = y + h / 2;
      var r  = Math.min(w, h) / 2 - 1;
      ctx.save();

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = Math.max(1.5, r * 0.12);
      ctx.stroke();

      // Inner highlight
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
      ctx.fillStyle = '#FFF9C4';
      ctx.fill();

      // Star symbol
      ctx.fillStyle = '#F9A825';
      ctx.font = 'bold ' + Math.max(8, Math.floor(r * 1.0)) + 'px sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', cx, cy + 1);

      ctx.restore();
    }

    function drawBrickWall(x, y, w, h) {
      ctx.save();

      // Dark mortar background
      ctx.fillStyle = '#5D3A1A';
      ctx.fillRect(x, y, w, h);

      var bH = Math.max(8, Math.round(h / Math.max(2, Math.round(h / 14))));
      var bW = Math.max(16, Math.round(w / Math.max(1, Math.round(w / 26))));
      var rows = Math.ceil(h / bH);

      for (var row = 0; row <= rows; row++) {
        var offset = (row % 2) * (bW / 2);
        var by = y + row * bH;
        var cols = Math.ceil((w + bW) / bW) + 1;
        for (var col = -1; col <= cols; col++) {
          var bx = x + col * bW - offset;
          var rx = Math.max(bx + 1, x);
          var ry = Math.max(by + 1, y);
          var rw = Math.min(bx + bW - 2, x + w) - rx;
          var rh = Math.min(by + bH - 2, y + h) - ry;
          if (rw > 2 && rh > 2) {
            ctx.fillStyle = '#C0623A';
            ctx.fillRect(rx, ry, rw, rh);
            // Highlight top edge
            ctx.fillStyle = '#D4795A';
            ctx.fillRect(rx, ry, rw, Math.max(1, rh * 0.3));
          }
        }
      }

      ctx.restore();
    }

    function drawSpikes(x, y, w, h) {
      ctx.save();

      var baseH = Math.max(4, h * 0.28);
      var baseY = y + h - baseH;

      // Base plate
      ctx.fillStyle = '#455A64';
      ctx.fillRect(x, baseY, w, baseH);

      // Spikes
      var numSpikes = Math.max(2, Math.floor(w / 13));
      var sW = w / numSpikes;

      for (var i = 0; i < numSpikes; i++) {
        var sx  = x + i * sW;
        var tipX = sx + sW / 2;

        ctx.beginPath();
        ctx.moveTo(sx + 1, baseY + baseH);
        ctx.lineTo(tipX, y + 1);
        ctx.lineTo(sx + sW - 1, baseY + baseH);
        ctx.closePath();
        ctx.fillStyle = '#78909C';
        ctx.fill();

        // Shine on left face
        ctx.beginPath();
        ctx.moveTo(sx + sW * 0.28, baseY + baseH * 0.7);
        ctx.lineTo(tipX - 1, y + 3);
        ctx.strokeStyle = '#CFD8DC';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawEntity(e) {
      ctx.save();
      if (e === player && invincibleMs > 0 && Math.floor(invincibleMs / 150) % 2 === 1) {
        ctx.restore();
        return;
      }

      if (e.role === 'player') {
        drawStickman(e.x, e.y, e.w, e.h, '#43A047');
      } else if (e.role === 'enemy') {
        drawStickman(e.x, e.y, e.w, e.h, '#E53935');
      } else if (e.role === 'collectible') {
        drawCoin(e.x, e.y, e.w, e.h);
      } else if (e.role === 'obstacle') {
        if (e.subtype === 'spikes') {
          drawSpikes(e.x, e.y, e.w, e.h);
        } else {
          drawBrickWall(e.x, e.y, e.w, e.h);
        }
      }

      ctx.restore();
    }

    // Render
    function render() {
      ctx.clearRect(0, 0, W, H);

      // Background
      if (bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, 0, 0, W, H);
      } else {
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(0, 0, W, H);
      }

      // Entities
      entities.forEach(function (e) {
        if (!e.alive) return;
        drawEntity(e);
      });

      updateHUD();
    }

    // Loop
    var lastTime = 0;
    function loop(ts) {
      var dt = Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;
      if (!won && !gameOver) update(dt);
      render();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(function (ts) { lastTime = ts; requestAnimationFrame(loop); });
  }
})();`
}
