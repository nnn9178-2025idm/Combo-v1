// game.js - Tic Tac Toe logic
(() => {
  const boardEl = document.getElementById('board');
  const cells = Array.from(document.querySelectorAll('.cell'));
  const turnEl = document.getElementById('turn');
  const statusEl = document.getElementById('status');
  const restartBtn = document.getElementById('restart');
  const resetScoresBtn = document.getElementById('resetScores');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayMessage = document.getElementById('overlayMessage');
  const overlayBtn = document.getElementById('overlayBtn');
  const scoreXEl = document.getElementById('scoreX');
  const scoreOEl = document.getElementById('scoreO');

  let board = Array(9).fill(null);
  let turn = 'X';
  let running = true;
  let scores = { X: 0, O: 0 };

let mode = null; // "pvp" or "cpu"

const startMenu = document.getElementById('startMenu');
const pvpBtn = document.getElementById('pvpBtn');
const cpuBtn = document.getElementById('cpuBtn');

pvpBtn.addEventListener('click', () => {
  mode = "pvp";
  startMenu.classList.add('hidden');
  startRound();
});

cpuBtn.addEventListener('click', () => {
  mode = "cpu";
  startMenu.classList.add('hidden');
  startRound();
});

  const WIN_COMBOS = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  function startRound(){
    board.fill(null);
    cells.forEach(c => {
      c.classList.remove('x','o');
      c.removeAttribute('disabled');
      c.textContent = '';
    });
    running = true;
    turn = 'X';
    updateTurnUI();
  }

  function updateTurnUI(){
    turnEl.textContent = turn;
    statusEl.setAttribute('aria-live','polite');
  }

  function handleMove(e){
    if (!running) return;
    const btn = e.currentTarget;
    const idx = Number(btn.dataset.index);
    if (board[idx]) return;
    board[idx] = turn;
    btn.textContent = turn;
    btn.classList.add(turn.toLowerCase());
    btn.setAttribute('disabled','');
    checkGame();
    if (running) switchTurn();

    if (mode === "cpu" && turn === "O" && running) {
      setTimeout(cpuMove, 600);
    }
  }

  function switchTurn(){
    turn = turn === 'X' ? 'O' : 'X';
    updateTurnUI();
  }

  function checkGame(){
    // check for win
    for (const combo of WIN_COMBOS){
      const [a,b,c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]){
        // winner
        running = false;
        highlightWin(combo);
        scores[board[a]] += 1;
        updateScores();
        showOverlay('Winner', `${board[a]} wins!`);
        return;
      }
    }
    // draw?
    if (board.every(Boolean)){
      running = false;
      showOverlay('Draw', `It's a draw.`);
    }
  }

  function highlightWin(combo){
    combo.forEach(i => {
      const el = cells[i];
      el.style.boxShadow = '0 8px 24px rgba(96,165,250,0.18)';
      // leave the class as is
    });
    // disable remaining cells
    cells.forEach(c => c.setAttribute('disabled',''));
  }

  function updateScores(){
    scoreXEl.textContent = scores.X;
    scoreOEl.textContent = scores.O;
  }

  function showOverlay(title, message){
    overlayTitle.textContent = title;
    overlayMessage.textContent = message;
    overlay.classList.remove('hidden');
  }

  function hideOverlay(){
    overlay.classList.add('hidden');
    // clear inline highlight boxShadows
    cells.forEach(c => c.style.boxShadow = '');
  }

  // Event listeners
  cells.forEach(c => c.addEventListener('click', handleMove));
  restartBtn.addEventListener('click', () => {
    startRound();
    hideOverlay();
  });
  overlayBtn.addEventListener('click', () => {
    startRound();
    hideOverlay();
  });
  resetScoresBtn.addEventListener('click', () => {
    scores = { X:0, O:0 };
    updateScores();
  });

  // keyboard support: numbers 1-9 map to cells
  document.addEventListener('keydown', (e) => {
    if (!running) return;
    const key = e.key;
    if (key >= '1' && key <= '9'){
      const idx = Number(key) - 1;
      cells[idx].click();
    }
  });

  // start first round
  startRound();

  function cpuMove() {
    const empty = board.map((v,i) => v ? null : i).filter(v => v !== null);
    if (empty.length === 0) return;
    const choice = empty[Math.floor(Math.random() * empty.length)];
    cells[choice].click();
  }

  // Expose simple API for adjusting behavior from console if needed
  window.TicTacToe = {
    restart: startRound,
    getState: () => ({ board: board.slice(), turn, scores }),
    setSpeedMultiplier: (m) => {
      // placeholder to mirror other game APIs (no moving parts here)
      console.warn('No animated pieces; speed multiplier ignored.');
    }
  };

})();
