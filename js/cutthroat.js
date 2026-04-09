/* Cutthroat Pool */

const GROUP_NAMES  = { 1: '1–5 (Yellows)', 2: '6–10 (Reds)', 3: '11–15 (Blues)' };
const GROUP_BALLS  = { 1: [1,2,3,4,5], 2: [6,7,8,9,10], 3: [11,12,13,14,15] };
const GROUP_CLASS  = { 1: 'group-1', 2: 'group-2', 3: 'group-3' };
const GROUP_DOT    = { 1: 'g1', 2: 'g2', 3: 'g3' };

let players = [];
let pottedBalls = new Set();  // ball numbers that are potted
let history = [];             // stack of potted ball numbers for undo

function randomAssign() {
  const groups = [1, 2, 3];
  for (let i = groups.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [groups[i], groups[j]] = [groups[j], groups[i]];
  }
  document.getElementById('p1Group').value = groups[0];
  document.getElementById('p2Group').value = groups[1];
  document.getElementById('p3Group').value = groups[2];
}

function startGame() {
  const names = [
    document.getElementById('p1Name').value.trim() || 'Player 1',
    document.getElementById('p2Name').value.trim() || 'Player 2',
    document.getElementById('p3Name').value.trim() || 'Player 3',
  ];
  const groups = [
    parseInt(document.getElementById('p1Group').value),
    parseInt(document.getElementById('p2Group').value),
    parseInt(document.getElementById('p3Group').value),
  ];

  // Validate unique groups
  if (new Set(groups).size !== 3) {
    alert('Each player must have a different ball group.');
    return;
  }

  players = names.map((name, i) => ({ name, group: groups[i] }));
  pottedBalls = new Set();
  history = [];

  document.getElementById('setupSection').classList.add('hidden');
  document.getElementById('gameSection').classList.remove('hidden');

  renderPlayerCards();
  renderBallGrid();
}

function getBallsRemaining(group) {
  return GROUP_BALLS[group].filter(b => !pottedBalls.has(b)).length;
}

function renderPlayerCards() {
  document.getElementById('playerCards').innerHTML = players.map(p => {
    const remaining = getBallsRemaining(p.group);
    const eliminated = remaining === 0;
    return `
      <div class="ct-player-card ${eliminated ? 'eliminated' : 'alive'}">
        <h3>${escHtml(p.name)}</h3>
        <div class="ct-player-balls-remaining">${remaining}</div>
        <div class="ct-player-group">
          <span class="ct-group-dot ${GROUP_DOT[p.group]}"></span>${GROUP_NAMES[p.group]}
        </div>
        <div class="ct-player-status">${eliminated ? '💀 Eliminated' : 'Still in'}</div>
      </div>`;
  }).join('');
}

function renderBallGrid() {
  const grid = document.getElementById('ballGrid');
  grid.innerHTML = '';
  for (let i = 1; i <= 15; i++) {
    const group = i <= 5 ? 1 : i <= 10 ? 2 : 3;
    const potted = pottedBalls.has(i);
    const btn = document.createElement('button');
    btn.className = `ct-ball ${GROUP_CLASS[group]}${potted ? ' potted' : ''}`;
    btn.setAttribute('aria-label', `Ball ${i}${potted ? ' (potted)' : ''}`);
    btn.setAttribute('aria-pressed', potted ? 'true' : 'false');
    btn.innerHTML = `<span class="ball-num">${i}</span>`;
    if (!potted) btn.addEventListener('click', () => potBall(i));
    grid.appendChild(btn);
  }
}

function potBall(num) {
  pottedBalls.add(num);
  history.push(num);

  renderBallGrid();
  renderPlayerCards();
  checkWin();
}

function checkWin() {
  const alive = players.filter(p => getBallsRemaining(p.group) > 0);
  if (alive.length === 1) {
    document.getElementById('winnerMsg').textContent = `🏆 ${alive[0].name} wins!`;
    document.getElementById('winnerDetail').textContent =
      `${alive[0].name}'s ${GROUP_NAMES[alive[0].group]} balls survived.`;

    document.getElementById('shareBtn').onclick = () =>
      shareResult(
        `🎱 ${alive[0].name} won Cutthroat Pool on ihavenocards!`,
        'https://ihavenocards.com/pages/pool/cutthroat/'
      );

    const _ctWinner = alive[0].name;
    const _ctPlayers = players.map(p => p.name);
    setTimeout(() => openWinnerOverlay('winnerOverlay', 'cutthroat', _ctWinner, _ctPlayers), 400);
  }
}

function undoPot() {
  if (history.length === 0) return;
  const last = history.pop();
  pottedBalls.delete(last);
  renderBallGrid();
  renderPlayerCards();
}

function confirmReset() {
  if (confirm('Reset the game?')) location.reload();
}

function escHtml(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();
  trackGame('cutthroat');

  document.getElementById('howToPlayBtn').addEventListener('click', () => openOverlay('rulesOverlay'));
  document.getElementById('closeRulesBtn').addEventListener('click', () => closeOverlay('rulesOverlay'));
});
