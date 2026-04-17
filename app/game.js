// ── Pixel art patterns (11 cols × 8 rows, two animation frames) ──────────────
const PAT = [
  // type 0 – Squid  (30 pts)
  [
    [[0,0,0,1,0,0,0,0,1,0,0],
     [0,0,0,0,1,0,0,1,0,0,0],
     [0,0,0,1,1,1,1,1,1,0,0],
     [0,0,1,1,0,1,1,0,1,1,0],
     [0,1,1,1,1,1,1,1,1,1,0],
     [0,0,1,0,1,1,1,1,0,1,0],
     [0,1,0,0,0,0,0,0,0,0,1],
     [0,0,1,0,0,0,0,0,1,0,0]],
    [[0,0,0,1,0,0,0,0,1,0,0],
     [1,0,0,0,1,0,1,0,0,0,1],
     [1,0,0,1,1,1,1,1,1,0,1],
     [1,1,1,1,0,1,1,0,1,1,1],
     [0,1,1,1,1,1,1,1,1,1,0],
     [0,0,1,1,1,1,1,1,1,0,0],
     [0,0,1,0,0,0,0,0,1,0,0],
     [0,1,0,0,0,0,0,0,0,1,0]]
  ],
  // type 1 – Crab   (20 pts)
  [
    [[0,0,1,0,0,0,0,0,1,0,0],
     [0,0,0,1,0,0,0,1,0,0,0],
     [0,0,1,1,1,1,1,1,1,0,0],
     [0,1,1,0,1,1,1,0,1,1,0],
     [1,1,1,1,1,1,1,1,1,1,1],
     [1,0,1,1,1,1,1,1,1,0,1],
     [1,0,1,0,0,0,0,0,1,0,1],
     [0,0,0,1,1,0,1,1,0,0,0]],
    [[0,0,1,0,0,0,0,0,1,0,0],
     [1,0,0,1,0,0,0,1,0,0,1],
     [1,0,1,1,1,1,1,1,1,0,1],
     [1,1,1,0,1,1,1,0,1,1,1],
     [0,1,1,1,1,1,1,1,1,1,0],
     [0,0,1,1,1,1,1,1,1,0,0],
     [0,1,0,0,0,0,0,0,0,1,0],
     [1,0,0,0,0,0,0,0,0,0,1]]
  ],
  // type 2 – Octopus (10 pts)
  [
    [[0,0,0,1,1,1,1,1,0,0,0],
     [0,1,1,1,1,1,1,1,1,1,0],
     [1,1,0,1,1,1,1,1,0,1,1],
     [1,1,1,1,1,1,1,1,1,1,1],
     [0,1,1,0,0,0,0,0,1,1,0],
     [0,0,1,1,1,1,1,1,1,0,0],
     [0,0,1,0,0,0,0,0,1,0,0],
     [0,1,0,0,0,0,0,0,0,1,0]],
    [[0,0,0,1,1,1,1,1,0,0,0],
     [0,1,1,1,1,1,1,1,1,1,0],
     [1,1,0,1,1,1,1,1,0,1,1],
     [1,1,1,1,1,1,1,1,1,1,1],
     [0,0,1,1,0,0,0,1,1,0,0],
     [0,1,1,0,1,1,1,0,1,1,0],
     [1,1,0,0,0,0,0,0,0,1,1],
     [0,1,0,0,0,0,0,0,0,1,0]]
  ]
];

const INV_COLOR = ['#ff71ce', '#b967ff', '#01cdfe'];

// ── Audio (Web Audio API, sintesi al volo) ────────────────────────────────────
let audioCtx = null;

function unlockAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
  }
  const kick = () => startMusic();
  // Safari: l'AudioContext parte in 'suspended' e va risvegliato prima di schedulare
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(kick).catch(kick);
  } else {
    kick();
  }
}

function playTone({ type='square', freqStart=600, freqEnd=200, duration=0.12,
                   gain=0.12, sweep='exp' } = {}) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t0);
  if (sweep === 'exp') osc.frequency.exponentialRampToValueAtTime(Math.max(1,freqEnd), t0 + duration);
  else                 osc.frequency.linearRampToValueAtTime(freqEnd, t0 + duration);
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

// Player shoot — "pew" agudo in discesa rapida
function sfxPlayerShoot() {
  playTone({ type:'square',   freqStart: 920, freqEnd: 140, duration: 0.12, gain: 0.12 });
}

// Enemy shoot — tono basso sporco (sawtooth + sweep lineare)
function sfxEnemyShoot() {
  playTone({ type:'sawtooth', freqStart: 260, freqEnd:  70, duration: 0.18, gain: 0.09, sweep:'lin' });
}

// ── Musica di sottofondo (pad vaporwave, progressione ii-V-I-vi slow) ─────────
// Accordi con settima maggiore/dominante per quel sapore dreamy/mallwave.
const MUSIC_CHORDS = [
  [261.63, 329.63, 392.00, 493.88],  // Cmaj7   (C E G B)
  [220.00, 261.63, 329.63, 392.00],  // Am7     (A C E G)
  [174.61, 220.00, 261.63, 329.63],  // Fmaj7   (F A C E)
  [196.00, 246.94, 293.66, 349.23],  // G7      (G B D F)
];
const CHORD_DUR = 3.2;  // secondi per accordo

let musicStarted = false;
let musicGain    = null;
let musicTimer   = null;
let musicMuted   = false;

function toggleMusic() {
  if (!audioCtx || !musicGain) {
    // Musica non ancora avviata: prova ad avviarla (utente ha cliccato, quindi è un gesto valido)
    musicMuted = false;
    unlockAudio();
    updateMusicBtn();
    return;
  }
  musicMuted = !musicMuted;
  const target = musicMuted ? 0 : 0.07;
  const t = audioCtx.currentTime;
  musicGain.gain.cancelScheduledValues(t);
  musicGain.gain.setValueAtTime(musicGain.gain.value, t);
  musicGain.gain.linearRampToValueAtTime(target, t + 0.25);
  updateMusicBtn();
}

function updateMusicBtn() {
  const b = document.getElementById('btn-music');
  if (!b) return;
  if (musicMuted) { b.classList.add('muted');    b.textContent = '♪ MUSIC OFF'; }
  else            { b.classList.remove('muted'); b.textContent = '♪ MUSIC';     }
}

function startMusic() {
  if (musicStarted || !audioCtx) return;
  musicStarted = true;

  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.07;
  musicGain.connect(audioCtx.destination);

  let idx = 0;

  const playChord = () => {
    if (!audioCtx) return;
    const chord = MUSIC_CHORDS[idx];
    const t0    = audioCtx.currentTime;

    // Pad: 4 voci sine leggermente detunate per un effetto chorus lo-fi
    chord.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const amp = audioCtx.createGain();
      osc.type           = 'sine';
      osc.detune.value   = (i % 2 === 0 ? -7 : 7);
      osc.frequency.value = f;
      amp.gain.setValueAtTime(0, t0);
      amp.gain.linearRampToValueAtTime(0.22, t0 + 0.7);
      amp.gain.setValueAtTime(0.22, t0 + CHORD_DUR - 0.6);
      amp.gain.linearRampToValueAtTime(0, t0 + CHORD_DUR);
      osc.connect(amp).connect(musicGain);
      osc.start(t0);
      osc.stop(t0 + CHORD_DUR + 0.05);
    });

    // Bassline: triangle un'ottava sotto la fondamentale
    const bass = audioCtx.createOscillator();
    const bAmp = audioCtx.createGain();
    bass.type           = 'triangle';
    bass.frequency.value = chord[0] / 2;
    bAmp.gain.setValueAtTime(0, t0);
    bAmp.gain.linearRampToValueAtTime(0.38, t0 + 0.15);
    bAmp.gain.setValueAtTime(0.38, t0 + CHORD_DUR - 0.4);
    bAmp.gain.linearRampToValueAtTime(0, t0 + CHORD_DUR);
    bass.connect(bAmp).connect(musicGain);
    bass.start(t0);
    bass.stop(t0 + CHORD_DUR + 0.05);

    idx = (idx + 1) % MUSIC_CHORDS.length;
  };

  playChord();
  musicTimer = setInterval(playChord, CHORD_DUR * 1000);
}

// ── Canvas & scale ────────────────────────────────────────────────────────────
const LW = 800, LH = 580;   // logical dimensions
const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');
let S = 1;

function resize() {
  const hudH     = document.getElementById('hud').offsetHeight;
  const actionsH = document.getElementById('game-actions').offsetHeight;
  const ctrlH    = window.matchMedia('(pointer:coarse)').matches
                     ? document.getElementById('controls').offsetHeight
                     : 0;
  // Buffer generoso: gap del flex (12px) + eventuale reflow font (~16px)
  const BUFFER = 32;
  const avW    = window.innerWidth;
  const avH    = window.innerHeight - hudH - actionsH - ctrlH - BUFFER;
  S = Math.min(avW / LW, avH / LH);
  canvas.width  = Math.floor(LW * S);
  canvas.height = Math.floor(LH * S);
  document.getElementById('hud').style.width = canvas.width + 'px';
  document.getElementById('game-actions').style.width = canvas.width + 'px';
  document.getElementById('controls').style.width = canvas.width + 'px';
}

// ── Game state ────────────────────────────────────────────────────────────────
const KEYS  = {};
const TOUCH = { left:false, right:false, fire:false };

let state, score, hiScore, lives, level;
let player, pBullets, eBullets, invaders, shields, ufo, particles;
let invDir, invMoveTimer, animFrame;
let eBulletTimer, ufoTimer;
let paused = false;

hiScore = 0; level = 1;

function togglePause() {
  if (state !== 'playing') return;  // si può mettere in pausa solo durante il gameplay
  paused = !paused;
  const b = document.getElementById('btn-pause');
  if (b) {
    if (paused) { b.classList.add('active');    b.textContent = '▶ RESUME'; }
    else        { b.classList.remove('active'); b.textContent = '⏸ PAUSE';  }
  }
}

function resetPauseBtn() {
  paused = false;
  const b = document.getElementById('btn-pause');
  if (b) { b.classList.remove('active'); b.textContent = '⏸ PAUSE'; }
}

function initGame() {
  score  = 0;
  lives  = 3;
  animFrame    = 0;
  invDir       = 1;
  invMoveTimer = 0;
  eBulletTimer = 0;
  ufoTimer     = 0;
  ufo          = null;
  pBullets     = [];
  eBullets     = [];
  particles    = [];

  player = { x: LW/2, y: LH - 46, w: 44, h: 22, cooldown: 0 };

  // Invaders: 11×5 grid
  invaders = [];
  const COLS=11, ROWS=5, IW=36, IH=22, GX=16, GY=16;
  const gW     = COLS*IW + (COLS-1)*GX;
  const startX = (LW - gW)/2 + IW/2;
  const startY = 68;
  for (let r=0; r<ROWS; r++) {
    for (let c=0; c<COLS; c++) {
      const type = r===0 ? 0 : r<=2 ? 1 : 2;
      const pts  = [30,20,10][type];
      invaders.push({ x: startX + c*(IW+GX), y: startY + r*(IH+GY), w:IW, h:IH, type, pts, alive:true });
    }
  }

  // Shields: 4 bunkers
  shields = [];
  const N=4, SW=56, SH=36, BK=7;
  const sp = LW/(N+1);
  const sy = LH - 108;
  for (let i=0; i<N; i++) {
    const sx = sp*(i+1) - SW/2;
    const blocks = [];
    const cols = Math.floor(SW/BK), rows = Math.floor(SH/BK);
    for (let r=0; r<rows; r++) {
      for (let c=0; c<cols; c++) {
        // Arch: remove inner bottom 2 rows center, top corners
        if (r < 1 && (c < 2 || c >= cols-2)) continue;
        if (r >= rows-2 && c >= 2 && c < cols-2) continue;
        blocks.push({ x: sx+c*BK, y: sy+r*BK, s: BK, hp: 4 });
      }
    }
    shields.push(blocks);
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state !== 'playing') return;
  if (paused) return;

  // Player movement
  const spd = 270;
  if (KEYS['ArrowLeft']  || KEYS['a'] || TOUCH.left)  player.x -= spd*dt;
  if (KEYS['ArrowRight'] || KEYS['d'] || TOUCH.right) player.x += spd*dt;
  player.x = Math.max(player.w/2, Math.min(LW - player.w/2, player.x));

  // Player shoot (1 bullet max)
  player.cooldown -= dt;
  if ((KEYS[' '] || TOUCH.fire) && player.cooldown <= 0 && pBullets.length < 1) {
    pBullets.push({ x: player.x, y: player.y - player.h/2 - 4 });
    player.cooldown = 0.42;
    sfxPlayerShoot();
  }

  // Bullets move
  pBullets.forEach(b => b.y -= 500*dt);
  pBullets = pBullets.filter(b => b.y > -12);
  eBullets.forEach(b => b.y += 220*dt);
  eBullets = eBullets.filter(b => b.y < LH+12);

  // Invader march
  const alive = invaders.filter(i => i.alive);
  if (!alive.length) { winLevel(); return; }

  const speedup = 1 + (55 - alive.length) / 55 * 2.8;
  const baseInterval = Math.max(0.08, 0.55 / speedup);
  invMoveTimer += dt;

  if (invMoveTimer >= baseInterval) {
    invMoveTimer = 0;
    animFrame ^= 1;

    const step = 12 * invDir;
    alive.forEach(i => i.x += step);

    const rmost = Math.max(...alive.map(i => i.x + i.w/2));
    const lmost = Math.min(...alive.map(i => i.x - i.w/2));

    if (rmost > LW-8 || lmost < 8) {
      invDir *= -1;
      alive.forEach(i => { i.x -= step; i.y += 14; });
    }

    if (Math.max(...alive.map(i => i.y + i.h)) >= player.y) { endGame(); return; }
  }

  // Enemy fire
  eBulletTimer += dt;
  const fireRate = Math.max(0.35, 1.1 - (level-1)*0.08);
  if (eBulletTimer >= fireRate) {
    eBulletTimer = 0;
    const s = alive[Math.floor(Math.random()*alive.length)];
    eBullets.push({ x: s.x, y: s.y + s.h });
    sfxEnemyShoot();
  }

  // UFO saucer
  ufoTimer += dt;
  if (!ufo && ufoTimer > 18 + Math.random()*14) {
    ufoTimer = 0;
    const dir = Math.random()<.5 ? 1 : -1;
    ufo = { x: dir===1 ? -28 : LW+28, y: 26, dir, spd: 130 };
  }
  if (ufo) {
    ufo.x += ufo.dir * ufo.spd * dt;
    if (ufo.x < -60 || ufo.x > LW+60) ufo = null;
  }

  // ── Collisions ──────────────────────────────────────────────────────────────

  // Player bullets
  outer:
  for (let bi = pBullets.length-1; bi >= 0; bi--) {
    const b = pBullets[bi];

    // vs invaders
    for (let ii=0; ii<invaders.length; ii++) {
      const inv = invaders[ii];
      if (!inv.alive) continue;
      if (b.x > inv.x-inv.w/2 && b.x < inv.x+inv.w/2 && b.y > inv.y && b.y < inv.y+inv.h) {
        inv.alive = false;
        score += inv.pts;
        spawnExplosion(inv.x, inv.y + inv.h/2, INV_COLOR[inv.type]);
        pBullets.splice(bi,1);
        continue outer;
      }
    }

    // vs UFO
    if (ufo && Math.abs(b.x-ufo.x)<24 && Math.abs(b.y-ufo.y)<13) {
      score += [50,100,150,200,300][Math.floor(Math.random()*5)];
      spawnExplosion(ufo.x, ufo.y, '#ff71ce');
      ufo = null;
      pBullets.splice(bi,1);
      continue outer;
    }

    // vs shields
    for (const sh of shields) {
      for (const blk of sh) {
        if (blk.hp>0 && b.x>=blk.x && b.x<blk.x+blk.s && b.y>=blk.y && b.y<blk.y+blk.s) {
          blk.hp--;
          pBullets.splice(bi,1);
          continue outer;
        }
      }
    }
  }

  // Enemy bullets vs player & shields
  outer2:
  for (let bi = eBullets.length-1; bi >= 0; bi--) {
    const b = eBullets[bi];
    if (b.x > player.x-player.w/2 && b.x < player.x+player.w/2 &&
        b.y > player.y && b.y < player.y+player.h) {
      eBullets.splice(bi,1);
      lives--;
      if (lives <= 0) { endGame(); return; }
      continue outer2;
    }
    for (const sh of shields) {
      for (const blk of sh) {
        if (blk.hp>0 && b.x>=blk.x && b.x<blk.x+blk.s && b.y>=blk.y && b.y<blk.y+blk.s) {
          blk.hp--;
          eBullets.splice(bi,1);
          continue outer2;
        }
      }
    }
  }

  // Particles
  for (let i = particles.length-1; i >= 0; i--) {
    const pt = particles[i];
    pt.x    += pt.vx * dt;
    pt.y    += pt.vy * dt;
    pt.vy   += 60 * dt;   // subtle gravity
    pt.life -= pt.decay * dt;
    if (pt.life <= 0) particles.splice(i, 1);
  }

  hiScore = Math.max(hiScore, score);
}

function endGame()  { hiScore = Math.max(hiScore,score); state='gameover'; }
function winLevel() { hiScore = Math.max(hiScore,score); level++; state='win'; }

function spawnExplosion(x, y, color) {
  const COUNT = 18;
  for (let i = 0; i < COUNT; i++) {
    const angle = (Math.PI * 2 / COUNT) * i + (Math.random() - .5) * .4;
    const speed = 40 + Math.random() * 90;
    const size  = 2 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      color,
      life: 1,          // normalized 1→0
      decay: 1.4 + Math.random() * 1.2,  // per second
    });
  }
  // Central flash ring (larger short-lived pixels)
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      x, y,
      vx: Math.cos(angle) * (15 + Math.random() * 25),
      vy: Math.sin(angle) * (15 + Math.random() * 25),
      size: 5 + Math.random() * 4,
      color: '#fffb96',
      life: 1,
      decay: 3.5 + Math.random() * 2,
    });
  }
}

// ── Draw helpers ──────────────────────────────────────────────────────────────
const p = v => v * S;

function glow(color, blur=12) { ctx.shadowBlur=blur; ctx.shadowColor=color; }
function noglow()              { ctx.shadowBlur=0; }

function setFont(size) {
  ctx.font = `${p(size)}px 'Press Start 2P',monospace`;
}

function text(str, x, y, color, size=12, align='center') {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  glow(color, 14);
  setFont(size);
  ctx.fillText(str, p(x), p(y));
  noglow();
}

// ── Draw game elements ────────────────────────────────────────────────────────
function drawBg() {
  ctx.fillStyle = '#0d0221';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Perspective grid lines
  ctx.strokeStyle = '#1a0538';
  ctx.lineWidth = 1;
  const g = 40;
  for (let x=0; x<=LW; x+=g) {
    ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(p(x),0); ctx.lineTo(p(x),canvas.height); ctx.stroke();
  }
  for (let y=0; y<=LH; y+=g) {
    ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(0,p(y)); ctx.lineTo(canvas.width,p(y)); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawInvader(inv) {
  if (!inv.alive) return;
  const pat = PAT[inv.type][animFrame];
  const pw = inv.w / 11;
  const ph = inv.h / 8;
  ctx.fillStyle = INV_COLOR[inv.type];
  glow(INV_COLOR[inv.type], 9);
  pat.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (!cell) return;
      ctx.fillRect(
        p(inv.x - inv.w/2 + c*pw),
        p(inv.y + r*ph),
        Math.max(1, p(pw) - .6),
        Math.max(1, p(ph) - .6)
      );
    });
  });
  noglow();
}

function drawPlayer() {
  const { x, y, w, h } = player;
  ctx.fillStyle = '#01cdfe';
  glow('#01cdfe', 16);
  ctx.fillRect(p(x-3),    p(y - h*.6),   p(6),     p(h*.6));   // barrel
  ctx.fillRect(p(x-w/2),  p(y - h*.15),  p(w),     p(h*.55));  // body
  ctx.fillRect(p(x-w/2+2),p(y + h*.4),   p(w-4),   p(h*.45));  // base
  noglow();
}

function drawUFO() {
  if (!ufo) return;
  const { x, y } = ufo;
  ctx.fillStyle = '#ff71ce';
  glow('#ff71ce', 16);
  ctx.beginPath(); ctx.ellipse(p(x), p(y+7), p(22), p(9), 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(p(x), p(y+2), p(12), p(8), 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fffb96';
  glow('#fffb96', 6);
  [-10,0,10].forEach(ox => { ctx.beginPath(); ctx.arc(p(x+ox), p(y+7), p(2.5), 0, Math.PI*2); ctx.fill(); });
  noglow();
}

function drawShields() {
  shields.forEach(sh => {
    sh.forEach(blk => {
      if (blk.hp <= 0) return;
      ctx.globalAlpha = blk.hp / 4;
      ctx.fillStyle = '#05ffa1';
      glow('#05ffa1', 5);
      ctx.fillRect(p(blk.x), p(blk.y), p(blk.s), p(blk.s));
      noglow();
    });
  });
  ctx.globalAlpha = 1;
}

function drawBullets() {
  ctx.fillStyle = '#fffb96'; glow('#fffb96', 10);
  pBullets.forEach(b => ctx.fillRect(p(b.x-1.5), p(b.y), p(3), p(11)));
  ctx.fillStyle = '#ff4488'; glow('#ff4488', 10);
  eBullets.forEach(b => ctx.fillRect(p(b.x-1.5), p(b.y), p(3), p(9)));
  noglow();
}

function drawParticles() {
  particles.forEach(pt => {
    ctx.globalAlpha = Math.max(0, pt.life);
    ctx.fillStyle   = pt.color;
    glow(pt.color, 8);
    const sz = p(pt.size * pt.life);
    ctx.fillRect(p(pt.x) - sz/2, p(pt.y) - sz/2, sz, sz);
  });
  ctx.globalAlpha = 1;
  noglow();
}

function drawGroundLine() {
  ctx.strokeStyle = '#b967ff';
  ctx.lineWidth = p(1.5);
  glow('#b967ff', 8);
  ctx.beginPath();
  ctx.moveTo(0, p(LH-28)); ctx.lineTo(canvas.width, p(LH-28));
  ctx.stroke();
  noglow();
}

// ── Screens ───────────────────────────────────────────────────────────────────
function drawStartScreen() {
  drawBg();

  // Glowing title
  text('VAPORWAVE', LW/2, 118, '#ff71ce', 26);
  text('INVADERS',  LW/2, 155, '#01cdfe', 26);

  if (Date.now() % 1100 < 660)
    text('PRESS SPACE TO START', LW/2, 225, '#b967ff', 9);

  text('— SCORE ADVANCE TABLE —', LW/2, 285, '#fffb96', 8);

  const tableRows = [
    { label:'= 30 PTS', type:0 },
    { label:'= 20 PTS', type:1 },
    { label:'= 10 PTS', type:2 },
    { label:'= ??? PTS', ufo:true },
  ];

  tableRows.forEach((row, i) => {
    const ty = 320 + i * 46;
    const mx = LW/2 - 100;

    if (row.ufo) {
      ctx.fillStyle = '#ff71ce'; glow('#ff71ce', 8);
      ctx.beginPath(); ctx.ellipse(p(mx+10), p(ty+4), p(14), p(6), 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(p(mx+10), p(ty),   p(7),  p(5), 0, 0, Math.PI*2); ctx.fill();
      noglow();
    } else {
      const pat = PAT[row.type][0];
      const pw = 20/11, ph = 14/8;
      ctx.fillStyle = INV_COLOR[row.type]; glow(INV_COLOR[row.type], 6);
      pat.forEach((r,ri)=> r.forEach((cell,ci)=>{
        if (cell) ctx.fillRect(p(mx-2+ci*pw), p(ty-6+ri*ph), Math.max(1,p(pw)-.4), Math.max(1,p(ph)-.4));
      }));
      noglow();
    }
    text(row.label, LW/2 + 28, ty + 7, row.ufo ? '#ff71ce' : INV_COLOR[row.type], 9, 'left');
  });

  text('← → TO MOVE   SPACE TO FIRE', LW/2, 543, '#4a1a6e', 7);
}

function overlay() {
  ctx.fillStyle = 'rgba(13,2,33,.82)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGameOver() {
  overlay();
  text('GAME OVER', LW/2, LH*.38, '#ff71ce', 24);
  text('SCORE: ' + score, LW/2, LH*.52, '#01cdfe', 11);
  if (Date.now() % 1100 < 660)
    text('SPACE / TAP TO RETRY', LW/2, LH*.65, '#b967ff', 8);
}

function drawWinScreen() {
  overlay();
  text('WAVE CLEARED!', LW/2, LH*.38, '#fffb96', 20);
  text('SCORE: ' + score, LW/2, LH*.52, '#01cdfe', 11);
  if (Date.now() % 1100 < 660)
    text('SPACE / TAP TO CONTINUE', LW/2, LH*.65, '#b967ff', 8);
}

function drawPausedScreen() {
  overlay();
  text('PAUSED', LW/2, LH*.44, '#fffb96', 26);
  if (Date.now() % 1100 < 660)
    text('PRESS P OR TAP RESUME', LW/2, LH*.58, '#b967ff', 8);
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  noglow();

  if (state === 'start') { drawStartScreen(); return; }

  drawBg();
  drawGroundLine();
  drawShields();
  invaders.forEach(drawInvader);
  drawUFO();
  drawPlayer();
  drawBullets();
  drawParticles();

  // HUD
  document.getElementById('h-score').textContent  = 'SCORE: '    + score;
  document.getElementById('h-hi').textContent     = 'HI-SCORE: ' + hiScore;
  document.getElementById('h-lives').textContent  = '♥ '.repeat(Math.max(0,lives)).trim();

  if (state === 'gameover') drawGameOver();
  if (state === 'win')      drawWinScreen();
  if (state === 'playing' && paused) drawPausedScreen();

  // RESET e MENU visibili solo in gameplay (PAUSE e MUSIC sempre visibili)
  const ga = document.getElementById('game-actions');
  if (ga) ga.classList.toggle('hide-play', state !== 'playing');
}

// ── Game loop ─────────────────────────────────────────────────────────────────
let lastT = 0;
function loop(t) {
  const dt = Math.min((t - lastT) / 1000, 0.05);
  lastT = t;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

// ── Input ─────────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  unlockAudio();
  KEYS[e.key] = true;
  if (e.key === ' ' || e.key === 'Space') {
    e.preventDefault();
    if (state !== 'playing') go();
  }
  if (e.key === 'p' || e.key === 'P') { e.preventDefault(); togglePause(); }
  if (e.key === 'm' || e.key === 'M') { e.preventDefault(); toggleMusic(); }
  if (e.key.startsWith('Arrow')) e.preventDefault();
});
document.addEventListener('keyup', e => { KEYS[e.key] = false; });

function go() {
  if (state === 'start' || state === 'gameover') { initGame(); resetPauseBtn(); state = 'playing'; }
  else if (state === 'win') { initGame(); resetPauseBtn(); state = 'playing'; }
}

// Touch on canvas (tap to advance state or fire)
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  unlockAudio();
  if (state !== 'playing') go();
}, { passive:false });

// Mobile buttons
function holdBtn(id, flag) {
  const el = document.getElementById(id);
  if (!el) return;
  ['touchstart','mousedown'].forEach(ev =>
    el.addEventListener(ev, e => { e.preventDefault(); unlockAudio(); TOUCH[flag]=true; if(state!=='playing') go(); }, { passive:false })
  );
  ['touchend','touchcancel','mouseup','mouseleave'].forEach(ev =>
    el.addEventListener(ev, e => { e.preventDefault(); TOUCH[flag]=false; }, { passive:false })
  );
}
holdBtn('btn-left',  'left');
holdBtn('btn-right', 'right');
holdBtn('btn-fire',  'fire');

// Action buttons: reset & back to menu
function clickBtn(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  const h = e => { e.preventDefault(); unlockAudio(); fn(); };
  el.addEventListener('click', h);
  el.addEventListener('touchstart', h, { passive: false });
}

clickBtn('btn-reset', () => { initGame(); resetPauseBtn(); state = 'playing'; });
clickBtn('btn-menu',  () => { resetPauseBtn(); state = 'start'; });
clickBtn('btn-pause', togglePause);
clickBtn('btn-music', toggleMusic);

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);
// Ri-adatta quando Press Start 2P finisce di caricare (cambia l'altezza di HUD/pulsanti)
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(resize);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
resize();
// Fallback per browser senza document.fonts.ready: ri-misura dopo il caricamento del font
setTimeout(resize, 300);
setTimeout(resize, 1200);
state = 'start';
requestAnimationFrame(loop);
