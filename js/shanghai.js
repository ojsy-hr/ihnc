/* Shanghai Darts */

const MAX_ROUND = 7;
let players = [], currentPlayerIdx = 0, currentRound = 1;
let dartsLeft = 3, turnDarts = [], turnHistory = [];
let selectedMultiplier = 1;

function updateSetup() {
  const n = parseInt(document.getElementById('playerCount').value);
  document.getElementById('playerCountDisplay').textContent = n;
  const container = document.getElementById('nameInputs');
  container.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = `Player ${i+1} name`;
    container.appendChild(inp);
  }
}

function startGame() {
  const inputs = document.querySelectorAll('#nameInputs input');
  players = Array.from(inputs).map((inp, i) => ({
    name: inp.value.trim() || `Player ${i+1}`,
    scores: Array(MAX_ROUND).fill(0),
    total: 0
  }));

  currentPlayerIdx = 0;
  currentRound = 1;
  turnDarts = [];
  dartsLeft = 3;

  document.getElementById('setupSection').classList.add('hidden');
  document.getElementById('gameSection').classList.remove('hidden');

  buildScoreboard();
  buildMultipliers();
  renderState();
}

function buildScoreboard() {
  const sb = document.getElementById('scoreboard');
  sb.innerHTML = players.map((p, i) => `
    <div class="darts-player-col${i === 0 ? ' active' : ''}" id="col-${i}">
      <h3>${p.name}</h3>
      <div class="darts-player-score" id="score-${i}">0</div>
      <div class="darts-player-detail" id="rounds-${i}"></div>
    </div>`).join('');
}

function buildMultipliers() {
  document.getElementById('multiplierBtns').innerHTML =
    ['Single','Double','Triple'].map((label, i) =>
      `<button class="${i===0?'active':''}" id="mult-${i+1}" onclick="selectMultiplier(${i+1})">${label}</button>`
    ).join('');
}

function selectMultiplier(n) {
  selectedMultiplier = n;
  document.querySelectorAll('.multiplier-row button').forEach(b => b.classList.remove('active'));
  document.getElementById('mult-' + n).classList.add('active');
}

function renderState() {
  document.getElementById('currentTarget').textContent = currentRound;
  document.getElementById('dartsLeftDisplay').textContent = dartsLeft;
  document.getElementById('currentTurnDisplay').textContent = players[currentPlayerIdx].name;

  // Turn darts display
  document.getElementById('turnDarts').innerHTML = [0,1,2].map(i => {
    if (i < turnDarts.length) {
      const d = turnDarts[i];
      const cls = d.score > 0 ? 'hit' : 'miss';
      const label = d.score > 0 ? `${d.mult === 2 ? 'D' : d.mult === 3 ? 'T' : 'S'}${currentRound}` : 'Miss';
      return `<span class="dart-thrown ${cls}">${label}</span>`;
    }
    return `<span class="dart-thrown pending">Dart ${i+1}</span>`;
  }).join('');

  // Scoreboard
  players.forEach((p, i) => {
    document.getElementById('score-' + i).textContent = p.total;
    const colEl = document.getElementById('col-' + i);
    colEl.classList.toggle('active', i === currentPlayerIdx);
    document.getElementById('rounds-' + i).textContent =
      `R${currentRound}: ${p.scores[currentRound-1]}`;
  });

  document.getElementById('confirmTurnBtn').classList.toggle('hidden', dartsLeft > 0);
}

function throwDart(mult) {
  if (dartsLeft === 0) return;
  const score = currentRound * mult;
  turnDarts.push({ mult, score });
  players[currentPlayerIdx].scores[currentRound - 1] += score;
  players[currentPlayerIdx].total += score;
  dartsLeft--;

  // Check Shanghai (single + double + triple all thrown this turn)
  if (turnDarts.length >= 1) {
    const mults = turnDarts.map(d => d.mult);
    if (mults.includes(1) && mults.includes(2) && mults.includes(3)) {
      // SHANGHAI!
      const _sWinner = players[currentPlayerIdx].name;
      const _sPlayers = players.map(p => p.name);
      setTimeout(() => {
        document.getElementById('winnerMsg').textContent = `🎯 SHANGHAI! ${_sWinner} wins instantly!`;
        document.getElementById('shareWinBtn').onclick = () =>
          shareResult(`🎯 ${_sWinner} hit a Shanghai in Round ${currentRound}! ihavenocards.com/pages/darts/shanghai/`);
        openWinnerOverlay('winnerOverlay', 'shanghai', _sWinner, _sPlayers);
      }, 300);
      renderState();
      return;
    }
  }

  renderState();
  if (dartsLeft === 0) document.getElementById('confirmTurnBtn').classList.remove('hidden');
}

function missThrow() {
  if (dartsLeft === 0) return;
  turnDarts.push({ mult: 0, score: 0 });
  dartsLeft--;
  renderState();
  if (dartsLeft === 0) document.getElementById('confirmTurnBtn').classList.remove('hidden');
}

function undoThrow() {
  if (turnDarts.length === 0) return;
  const last = turnDarts.pop();
  if (last.score > 0) {
    players[currentPlayerIdx].scores[currentRound - 1] -= last.score;
    players[currentPlayerIdx].total -= last.score;
  }
  dartsLeft++;
  document.getElementById('confirmTurnBtn').classList.add('hidden');
  renderState();
}

function confirmTurn() {
  turnDarts = [];
  dartsLeft = 3;

  // Next player
  currentPlayerIdx++;
  if (currentPlayerIdx >= players.length) {
    currentPlayerIdx = 0;
    currentRound++;
    if (currentRound > MAX_ROUND) {
      endGame();
      return;
    }
  }

  selectedMultiplier = 1;
  document.querySelectorAll('.multiplier-row button').forEach(b => b.classList.remove('active'));
  document.getElementById('mult-1').classList.add('active');

  renderState();
}

function endGame() {
  // Find winner (highest total)
  let best = -1, winner = null;
  players.forEach(p => { if (p.total > best) { best = p.total; winner = p; } });

  const tied = players.filter(p => p.total === best);
  const msg = tied.length > 1
    ? `🤝 Tie! ${tied.map(p => p.name).join(' & ')} with ${best} points.`
    : `🏆 ${winner.name} wins with ${best} points!`;

  document.getElementById('winnerMsg').textContent = msg;
  document.getElementById('shareWinBtn').onclick = () =>
    shareResult(msg + ' — Shanghai on ihavenocards.com/pages/darts/shanghai/');
  const _endWinner = tied.length > 1 ? tied[0].name : winner.name;
  openWinnerOverlay('winnerOverlay', 'shanghai', _endWinner, players.map(p => p.name));
}

function resetGame() {
  document.getElementById('setupSection').classList.remove('hidden');
  document.getElementById('gameSection').classList.add('hidden');
  updateSetup();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();
  trackGame('shanghai');
  updateSetup();

  document.getElementById('howToPlayBtn').addEventListener('click', () => openOverlay('rulesOverlay'));
  document.getElementById('closeRulesBtn').addEventListener('click', () => closeOverlay('rulesOverlay'));

  // Wire the multiplier buttons to throwDart
  document.getElementById('multiplierBtns').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn || !btn.id.startsWith('mult-')) return;
    const mult = parseInt(btn.id.replace('mult-',''));
    selectMultiplier(mult);
    throwDart(mult);
  });
});
