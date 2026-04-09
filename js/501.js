/* ==========================================================
   ihavenocards — 501 Darts
   ========================================================== */

const STORAGE_KEY = 'ihnc_501';

// ── State ─────────────────────────────────────────────────
let players          = [];   // [{ name, score, startScore }]
let currentPlayerIdx = 0;
let turnHistory      = [];   // [{ playerIdx, scoreBefore, scoreDeducted, bust }]
let selectedStartScore = 501;
let doubleOutEnabled = false;
let gameActive       = false;

// Pending double-out confirmation score
let pendingDoubleScore = null;

// ── Checkout hints (canonical 3-dart outs for 2–170) ──────
const CHECKOUT_HINTS = {
  170: 'T20 T20 Bull', 167: 'T20 T19 Bull', 164: 'T19 T19 Bull',
  161: 'T20 T17 Bull', 160: 'T20 T20 D20',  158: 'T20 T20 D19',
  157: 'T20 T19 D20',  156: 'T20 T20 D18',  155: 'T20 T19 D19',
  154: 'T20 T18 D20',  153: 'T20 T19 D18',  152: 'T20 T20 D16',
  151: 'T20 T17 D20',  150: 'T20 T18 D18',  149: 'T20 T19 D16',
  148: 'T20 T16 D20',  147: 'T20 T17 D18',  146: 'T20 T18 D16',
  145: 'T20 T15 D20',  144: 'T20 T16 D18',  143: 'T20 T17 D16',
  142: 'T20 T14 D20',  141: 'T20 T15 D18',  140: 'T20 T16 D16',
  139: 'T20 T13 D20',  138: 'T20 T14 D18',  137: 'T20 T15 D16',
  136: 'T20 T12 D20',  135: 'T20 T13 D18',  134: 'T20 T14 D16',
  133: 'T20 T11 D20',  132: 'T20 T12 D18',  131: 'T20 T13 D16',
  130: 'T20 T10 D20',  129: 'T20 T11 D18',  128: 'T20 T12 D16',
  127: 'T20 T9 D20',   126: 'T19 T9 D18',   125: 'Bull T20 D20',
  124: 'T20 T8 D20',   123: 'T20 T9 D18',   122: 'T18 T8 D20',
  121: 'T20 T11 D10',  120: 'T20 S20 D20',  119: 'T19 T10 D16',
  118: 'T20 S18 D20',  117: 'T20 S17 D20',  116: 'T20 S16 D20',
  115: 'T20 S15 D20',  114: 'T20 S14 D20',  113: 'T20 S13 D20',
  112: 'T20 S12 D20',  111: 'T20 S11 D20',  110: 'T20 S10 D20',
  109: 'T20 S9 D20',   108: 'T20 S8 D20',   107: 'T20 S7 D20',
  106: 'T20 S6 D20',   105: 'T20 S5 D20',   104: 'T20 S4 D20',
  103: 'T20 S3 D20',   102: 'T20 S2 D20',   101: 'T20 S1 D20',
  100: 'T20 D20',       99: 'T19 S10 D16',   98: 'T20 D19',
   97: 'T19 D20',       96: 'T20 D18',        95: 'T19 D19',
   94: 'T18 D20',       93: 'T19 D18',        92: 'T20 D16',
   91: 'T17 D20',       90: 'T18 D18',        89: 'T19 D16',
   88: 'T20 D14',       87: 'T17 D18',        86: 'T18 D16',
   85: 'T15 D20',       84: 'T20 D12',        83: 'T17 D16',
   82: 'Bull D16',      81: 'T19 D12',        80: 'T20 D10',
   79: 'T19 D11',       78: 'T18 D12',        77: 'T19 D10',
   76: 'T20 D8',        75: 'T17 D12',        74: 'T14 D16',
   73: 'T19 D8',        72: 'T16 D12',        71: 'T13 D16',
   70: 'T18 D8',        69: 'T15 D12',        68: 'T20 D4',
   67: 'T17 D8',        66: 'T10 D18',        65: 'Bull D15',
   64: 'T16 D8',        63: 'T13 D12',        62: 'T10 D16',
   61: 'T15 D8',        60: 'S20 D20',        59: 'S19 D20',
   58: 'S18 D20',       57: 'S17 D20',        56: 'T16 D4',
   55: 'S15 D20',       54: 'S14 D20',        53: 'S13 D20',
   52: 'S12 D20',       51: 'S11 D20',        50: 'Bull',
   49: 'S9 D20',        48: 'S8 D20',         47: 'S7 D20',
   46: 'S6 D20',        45: 'S5 D20',         44: 'S4 D20',
   43: 'S3 D20',        42: 'S10 D16',        41: 'S9 D16',
   40: 'D20',           39: 'S7 D16',         38: 'D19',
   37: 'S5 D16',        36: 'D18',            35: 'S3 D16',
   34: 'D17',           33: 'S1 D16',         32: 'D16',
   31: 'S7 D12',        30: 'D15',            29: 'S3 D13',
   28: 'D14',           27: 'S3 D12',         26: 'D13',
   25: 'S9 D8',         24: 'D12',            23: 'S7 D8',
   22: 'D11',           21: 'S5 D8',          20: 'D10',
   19: 'S3 D8',         18: 'D9',             17: 'S1 D8',
   16: 'D8',            15: 'S7 D4',          14: 'D7',
   13: 'S5 D4',         12: 'D6',             11: 'S3 D4',
   10: 'D5',             9: 'S1 D4',           8: 'D4',
    7: 'S3 D2',          6: 'D3',              5: 'S1 D2',
    4: 'D2',             3: 'S1 D1',           2: 'D1',
};

// ── Number-to-words for score announcements ────────────────
const ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function numberToWords(n) {
  if (n === 180) return 'one hundred and eighty';
  if (n === 100) return 'ton';
  if (n === 0)   return 'no score';
  if (n < 20)    return ONES[n];
  if (n < 100)   return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  // 101–179
  const rem = n - 100;
  return 'one hundred and ' + numberToWords(rem);
}

function speakScore(scored) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(numberToWords(scored));

  // Prefer a natural-sounding voice — look for Google/Apple enhanced voices first,
  // then fall back to any available en-GB or en-US voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    /google|natural|enhanced|premium/i.test(v.name) && /en/i.test(v.lang)
  ) || voices.find(v => /en-GB/i.test(v.lang))
    || voices.find(v => /en/i.test(v.lang));
  if (preferred) utt.voice = preferred;

  utt.rate  = 0.88;  // slightly slower for clarity
  utt.pitch = 0.95;  // slightly lower pitch, less robotic
  utt.volume = 1.0;
  window.speechSynthesis.speak(utt);
}

// ── HTML escape helper ────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Setup ─────────────────────────────────────────────────
function updateSetup() {
  const n = parseInt(document.getElementById('playerCount').value, 10);
  document.getElementById('playerCountDisplay').textContent = n;
  const container = document.getElementById('nameInputs');
  const saved = getSavedNames();
  const current = Array.from(container.querySelectorAll('input')).map(i => i.value);
  container.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'player-name-input';
    inp.maxLength = 25;
    inp.placeholder = `Player ${i + 1}`;
    inp.value = current[i] !== undefined ? current[i] : (saved[i] || '');
    container.appendChild(inp);
  }
}

function startGame() {
  const inputs = document.querySelectorAll('#nameInputs input');
  const names = Array.from(inputs).map((inp, i) => inp.value.trim() || `Player ${i + 1}`);
  saveNames(names.filter(Boolean));

  const startVal = parseInt(document.getElementById('startingScoreInput').value, 10);
  if (isNaN(startVal) || startVal < 11 || startVal > 5000) { showToast('Starting score must be between 11 and 5000'); return; }
  selectedStartScore = startVal;
  doubleOutEnabled = document.getElementById('doubleOutToggle').checked;
  players = names.map(name => ({
    name,
    score: selectedStartScore,
    startScore: selectedStartScore,
  }));
  currentPlayerIdx = 0;
  turnHistory = [];
  gameActive = true;

  document.getElementById('setupSection').classList.add('hidden');
  document.getElementById('gameSection').classList.remove('hidden');

  renderState();
  saveState();
  trackGame('501');

  setTimeout(() => {
    const inp = document.getElementById('turnScore');
    if (inp) { inp.value = ''; inp.focus(); }
  }, 100);
}

// ── Core turn logic ───────────────────────────────────────
function submitTurn() {
  if (!gameActive) return;
  const input = document.getElementById('turnScore');
  const raw = input.value.trim();
  if (raw === '') { showToast('Enter a score first'); return; }

  const scored = parseInt(raw, 10);
  if (isNaN(scored) || scored < 0 || scored > 180) {
    showToast('Score must be between 0 and 180');
    return;
  }

  const player = players[currentPlayerIdx];
  const newScore = player.score - scored;

  // Bust: below zero
  if (newScore < 0) {
    input.value = '';
    triggerBust();
    return;
  }

  // Bust: lands on 1 (unreachable double finish)
  if (newScore === 1) {
    input.value = '';
    triggerBust();
    return;
  }

  // Double-out check when reaching exactly zero
  if (doubleOutEnabled && newScore === 0 && scored > 0) {
    pendingDoubleScore = scored;
    input.value = '';
    handleDoubleOutConfirm();
    return;
  }

  input.value = '';
  applyScore(scored);
}

function applyScore(scored) {
  const player = players[currentPlayerIdx];
  const scoreBefore = player.score;
  player.score -= scored;

  turnHistory.push({ playerIdx: currentPlayerIdx, scoreBefore, scoreDeducted: scored, bust: false });

  speakScore(scored);

  if (player.score === 0) {
    gameActive = false;
    Store.remove(STORAGE_KEY);
    renderState();
    setTimeout(() => showWinner(player.name), 350);
    return;
  }

  advanceTurn();
  renderState();
  saveState();
}

function triggerBust() {
  const player = players[currentPlayerIdx];
  turnHistory.push({ playerIdx: currentPlayerIdx, scoreBefore: player.score, scoreDeducted: 0, bust: true });

  const banner = document.getElementById('bustBanner');
  banner.classList.remove('hidden');
  // Re-trigger shake animation by cloning
  banner.style.animation = 'none';
  void banner.offsetWidth;
  banner.style.animation = '';
  setTimeout(() => banner.classList.add('hidden'), 1800);

  SoundManager.play('life-lost');

  advanceTurn();
  renderState();
  saveState();
}

function handleDoubleOutConfirm() {
  document.getElementById('doubleConfirmYes').onclick = () => {
    closeOverlay('doubleConfirmOverlay');
    applyScore(pendingDoubleScore);
    pendingDoubleScore = null;
  };
  document.getElementById('doubleConfirmNo').onclick = () => {
    closeOverlay('doubleConfirmOverlay');
    pendingDoubleScore = null;
    triggerBust();
  };
  openOverlay('doubleConfirmOverlay');
}

function advanceTurn() {
  currentPlayerIdx = (currentPlayerIdx + 1) % players.length;
  setTimeout(() => {
    const inp = document.getElementById('turnScore');
    if (inp) { inp.value = ''; inp.focus(); }
  }, 50);
}

function undoTurn() {
  if (turnHistory.length === 0) { showToast('Nothing to undo'); return; }
  const last = turnHistory.pop();
  currentPlayerIdx = last.playerIdx;
  players[currentPlayerIdx].score = last.scoreBefore;
  gameActive = true;
  document.getElementById('bustBanner').classList.add('hidden');
  renderState();
  saveState();
  setTimeout(() => {
    const inp = document.getElementById('turnScore');
    if (inp) inp.focus();
  }, 50);
}

// ── Render ────────────────────────────────────────────────
function scoreClass(remaining, start) {
  const pct = remaining / start;
  if (pct <= 0.1) return 'fiveo1-score-danger';
  if (pct <= 0.3) return 'fiveo1-score-warning';
  return '';
}

function renderState() {
  if (players.length === 0) return;
  const player = players[currentPlayerIdx];

  document.getElementById('currentTurnDisplay').textContent = player.name;
  const scoreEl = document.getElementById('currentScoreDisplay');
  scoreEl.textContent = player.score;
  scoreEl.className = 'darts-info-val fiveo1-big-score ' + scoreClass(player.score, player.startScore);

  // Scoreboard
  document.getElementById('scoreboard').innerHTML = players.map((p, i) => {
    const pctDone = Math.round((1 - p.score / p.startScore) * 100);
    const cls = scoreClass(p.score, p.startScore);
    return `
      <div class="darts-player-col${i === currentPlayerIdx ? ' active' : ''}">
        <h3>${escHtml(p.name)}</h3>
        <div class="darts-player-score ${cls}">${p.score}</div>
        <div class="darts-player-detail">${pctDone}% done</div>
      </div>`;
  }).join('');

  updateCheckoutHint(player.score);
}

function updateCheckoutHint(remaining) {
  const el = document.getElementById('checkoutHint');
  if (remaining > 170 || remaining <= 1) {
    el.classList.add('hidden');
    return;
  }
  const hint = CHECKOUT_HINTS[remaining];
  if (hint) {
    el.textContent = '🎯 Checkout: ' + hint;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

// ── Win & Reset ───────────────────────────────────────────
function showWinner(name) {
  document.getElementById('winnerMsg').textContent = `🏆 ${name} wins!`;
  document.getElementById('shareWinBtn').onclick = () => {
    const text = `🎯 ${name} won a game of ${selectedStartScore} Darts on ihavenocards! ihavenocards.com/pages/darts/501/`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!'));
    }
  };
  openWinnerOverlay('winnerOverlay', '501', name, players.map(p => p.name));
}

function resetGame() {
  gameActive = false;
  Store.remove(STORAGE_KEY);
  players = [];
  turnHistory = [];
  currentPlayerIdx = 0;
  document.getElementById('gameSection').classList.add('hidden');
  document.getElementById('bustBanner').classList.add('hidden');
  document.getElementById('setupSection').classList.remove('hidden');
  updateSetup();
}

function confirmResetGame() {
  openOverlay('resetConfirmOverlay');
}

function doResetGame() {
  closeOverlay('resetConfirmOverlay');
  resetGame();
}

// ── Persistence ───────────────────────────────────────────
function saveState() {
  if (!gameActive) return;
  Store.set(STORAGE_KEY, {
    players,
    currentPlayerIdx,
    turnHistory,
    selectedStartScore,
    doubleOutEnabled,
  });
}

function loadState() {
  const s = Store.get(STORAGE_KEY, null);
  if (!s || !Array.isArray(s.players) || s.players.length === 0) return false;
  try {
    players          = s.players;
    currentPlayerIdx = s.currentPlayerIdx || 0;
    turnHistory      = s.turnHistory || [];
    selectedStartScore = s.selectedStartScore || 501;
    doubleOutEnabled = s.doubleOutEnabled || false;
    gameActive = true;
    return true;
  } catch (_) {
    Store.remove(STORAGE_KEY);
    return false;
  }
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  // Player count slider
  document.getElementById('playerCount').addEventListener('input', updateSetup);
  updateSetup();

  // How to play
  document.getElementById('howToPlayBtn').addEventListener('click', () => openOverlay('rulesOverlay'));
  document.getElementById('closeRulesBtn').addEventListener('click', () => closeOverlay('rulesOverlay'));

  // Enter key submits turn
  document.getElementById('turnScore').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitTurn();
  });

  // Restore saved game or show fresh setup
  if (loadState()) {
    document.getElementById('setupSection').classList.add('hidden');
    document.getElementById('gameSection').classList.remove('hidden');
    renderState();
  }
});
