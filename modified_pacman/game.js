let running = false;
// Simple Pac‑Man clone (minimal, single file game logic).
// Grid-based map, pellets, walls, simple ghost AI (random choice).
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const restartBtn = document.getElementById('restart');

const CELL = 24; // size of one cell in px
const COLS = Math.floor(canvas.width / CELL);
const ROWS = Math.floor(canvas.height / CELL);

let map = []; // will be filled with numbers: 0 empty,1 wall,2 pellet,3 power
let pelletsTotal = 0;
let score = 0;
let lives = 3;
let powered = 0; // frames of power state
const POWER_LENGTH = 800; // frames



// Simple map: bordered box with inner walls and pellets.
function makeMap() {
  map = new Array(ROWS);
  pelletsTotal = 0;
  for (let r = 0; r < ROWS; r++) {
    map[r] = new Array(COLS).fill(2); // pellets everywhere
    for (let c = 0; c < COLS; c++) {
      if (r === 0 || c === 0 || r === ROWS-1 || c === COLS-1) map[r][c] = 1; // outer wall
    }
  }
  // add some interior walls
  for (let r = 3; r < ROWS-3; r+=4) {
    for (let c = 3; c < COLS-3; c++) {
      if (c % 2 === 0) map[r][c] = 1;
    }
  }
  // clear center area for ghost house
  const midR = Math.floor(ROWS/2), midC = Math.floor(COLS/2);
  for (let r = midR-2; r <= midR+1; r++) for (let c = midC-3; c <= midC+3; c++) map[r][c] = 0;
  // place four power pellets in corners (but inside walls)
  map[1][1]=3; map[1][COLS-2]=3; map[ROWS-2][1]=3; map[ROWS-2][COLS-2]=3;
  // count pellets
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (map[r][c] === 2) pelletsTotal++;
}

// Entities
let pac = {r: ROWS-4, c: 2, dir:0, nextDir:0, px:0, py:0, speed:0.12};
const ghosts = [];

function createGhost(r,c,color){
  return {r,c,px:0,py:0,dir:0,color,homeR:r,homeC:c,dead:false};
}

function resetEntities() {
  pac.r = ROWS-4; pac.c = 2; pac.px = pac.c*CELL; pac.py = pac.r*CELL; pac.dir=0; pac.nextDir=0;
  ghosts.length = 0;
  ghosts.push(createGhost(Math.floor(ROWS/2), Math.floor(COLS/2)+1,'red'));
  ghosts.push(createGhost(Math.floor(ROWS/2), Math.floor(COLS/2)-1,'pink'));
  ghosts.push(createGhost(Math.floor(ROWS/2)+1, Math.floor(COLS/2),'cyan'));
  ghosts.push(createGhost(Math.floor(ROWS/2)-1, Math.floor(COLS/2),'orange'));
}

// Input
const KEY = {37:-1,38:-2,39:1,40:2,65:-1,87:-2,68:1,83:2}; // arrows and WASD mapping to dirs
window.addEventListener('keydown', (e)=>{
  const v = KEY[e.keyCode] ?? KEY[e.key];
  if (v) pac.nextDir = v;
});

restartBtn.addEventListener('click', ()=>{ start(); });

// helpers
function tileAt(r,c){ if(r<0||c<0||r>=ROWS||c>=COLS) return 1; return map[r][c]; }
function canMoveTo(r,c){ return tileAt(r,c) !== 1; }
function dirToDelta(d){
  if(d===1) return [0,1]; // right
  if(d===-1) return [0,-1]; // left
  if(d===-2) return [-1,0]; // up
  if(d===2) return [1,0]; // down
  return [0,0];
}

function updatePac() {
  // attempt to change direction if possible
  const [nrDelta, ncDelta] = dirToDelta(pac.nextDir);
  const nextR = pac.r + nrDelta, nextC = pac.c + ncDelta;
  if (pac.nextDir !== 0 && canMoveTo(nextR,nextC)) pac.dir = pac.nextDir;
  // move based on pac.dir
  const [dr,dc] = dirToDelta(pac.dir);
  const targetR = pac.r + dr, targetC = pac.c + dc;
  if (canMoveTo(targetR,targetC)) {
    // smooth position
    pac.px += dc * pac.speed * CELL;
    pac.py += dr * pac.speed * CELL;
    // snap when near center
    const centerX = pac.c*CELL, centerY = pac.r*CELL;
    if (Math.abs(pac.px - centerX) >= CELL/2 || Math.abs(pac.py - centerY) >= CELL/2) {
      // update cell coordinate when crossing cell center
      if (Math.abs(pac.px - centerX) >= CELL/2) pac.c += Math.sign(pac.px - centerX);
      if (Math.abs(pac.py - centerY) >= CELL/2) pac.r += Math.sign(pac.py - centerY);
      pac.px = pac.c*CELL; pac.py = pac.r*CELL;
    }
  } else {
    // align to cell center
    pac.px = pac.c*CELL; pac.py = pac.r*CELL;
  }

  // collect pellet if present
  if (map[pac.r][pac.c] === 2) { map[pac.r][pac.c] = 0; score += 10; pelletsTotal--; }
  if (map[pac.r][pac.c] === 3) { map[pac.r][pac.c] = 0; score += 50; powered = POWER_LENGTH; }
}

function updateGhost(g) {
  if (g.dead) {
    // return to home
    if (g.r === g.homeR && g.c === g.homeC) g.dead = false;
    else {
      // simple move towards home (BFS would be better; do greedy)
      const best = chooseGreedyTowards(g, g.homeR, g.homeC);
      g.r = best.r; g.c = best.c; g.px = g.c*CELL; g.py = g.r*CELL;
    }
    return;
  }

  // choose direction periodically
  if (!g.dir || Math.random() < 0.02) {
    const choices = [];
    for (const d of [1,-1,2,-2]) {
      const [dr,dc] = dirToDelta(d);
      if (canMoveTo(g.r+dr,g.c+dc)) choices.push(d);
    }
    if (choices.length) g.dir = choices[Math.floor(Math.random()*choices.length)];
  }
  const [dr,dc] = dirToDelta(g.dir);
  if (canMoveTo(g.r+dr,g.c+dc)) {
    g.r += dr; g.c += dc; g.px = g.c*CELL; g.py = g.r*CELL;
  } else {
    g.dir = 0;
  }
}

function chooseGreedyTowards(g, tr, tc) {
  // choose neighbor that reduces Manhattan distance
  let best = {r:g.r,c:g.c,dist:Math.abs(g.r-tr)+Math.abs(g.c-tc)};
  for (const d of [1,-1,2,-2]) {
    const [dr,dc] = dirToDelta(d);
    const nr=g.r+dr,nc=g.c+dc;
    if (!canMoveTo(nr,nc)) continue;
    const dist = Math.abs(nr-tr)+Math.abs(nc-tc);
    if (dist < best.dist) { best={r:nr,c:nc,dist}; }
  }
  return best;
}

function checkCollisions() {
  for (const g of ghosts) {
    const dist = Math.hypot(pac.px - g.px, pac.py - g.py);
    if (dist < CELL*0.7) {
      if (powered) {
        // eat ghost
        g.dead = true; score += 200;
      } else {
        // lose life and reset
        lives--; if (lives<=0) { alert('Game Over! Score: '+score); start(); return; }
        resetEntities(); return;
      }
    }
  }
  if (pelletsTotal === 0) { alert('You Win! Score: '+score); start(); return; }
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // draw map: walls and pellets
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
    const x = c*CELL, y = r*CELL;
    if (map[r][c] === 1) { ctx.fillStyle='#FCC6BB'; ctx.fillRect(x+2,y+2,CELL-4,CELL-4); }
    if (map[r][c] === 2) { ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x+CELL/2,y+CELL/2,3,0,Math.PI*2); ctx.fill(); }
    if (map[r][c] === 3) { ctx.fillStyle='#ffd24a'; ctx.beginPath(); ctx.arc(x+CELL/2,y+CELL/2,6,0,Math.PI*2); ctx.fill(); }
  }

  // draw pacman (simple circle with mouth)
  ctx.save();
  ctx.translate(pac.px + CELL/2, pac.py + CELL/2);
  const mouth = Math.abs(Math.sin(Date.now()/120)) * Math.PI/4;
  ctx.fillStyle = '#ffd400'; ctx.beginPath();
  let ang = 0;
  if (pac.dir === 1) ang = 0;
  if (pac.dir === -1) ang = Math.PI;
  if (pac.dir === -2) ang = -Math.PI/2;
  if (pac.dir === 2) ang = Math.PI/2;
  ctx.moveTo(0,0);
  ctx.arc(0,0, CELL/2 - 2, ang+mouth, ang - mouth, false);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  // draw ghosts
  for (const g of ghosts) {
    ctx.save();
    ctx.translate(g.px + CELL/2, g.py + CELL/2);
    ctx.beginPath();
    const r = CELL/2 - 2;
    ctx.moveTo(-r,0);
    ctx.arc(0,0,r,Math.PI,0,false);
    // body bottom zigzag
    ctx.lineTo(r, r);
    ctx.lineTo(-r, r);
    ctx.closePath();
    ctx.fillStyle = powered ? '#6ab04c' : g.color;
    ctx.fill();
    ctx.restore();
  }

  // HUD
  scoreEl.textContent = 'Score: ' + score;
  livesEl.textContent = 'Lives: ' + lives;
}

let frame=0;
function loop() {
  frame++;
  // update entities multiple times per frame for smoother movement
  updatePac();
  if (frame % 3 === 0) {
  for (const g of ghosts) updateGhost(g);
}
  if (powered>0) powered--;
  checkCollisions();
  draw();
  requestAnimationFrame(loop);
}

function start() {
  if (running) return;  // 👈 don’t start a new loop if one is already running

  makeMap();
  score = 0;
  lives = 3;
  powered = 0;
  resetEntities();
  pac.px = pac.c * CELL;
  pac.py = pac.r * CELL;

  frame = 0;
  running = true;
  requestAnimationFrame(loop);
}
// Build initial map and entities so board is visible before Start
makeMap();
resetEntities();
draw();


