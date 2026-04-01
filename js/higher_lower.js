/* Higher or Lower */

const SUITS   = ['♠', '♥', '♦', '♣'];
const RANKS   = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const VALUES  = { A:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,10:10,J:11,Q:12,K:13 };
const IS_RED  = { '♥': true, '♦': true, '♠': false, '♣': false };

let deck = [], currentCard = null, streak = 0, best = 0, gameActive = true;

/* ── Deck helpers ── */
function buildDeck() {
  const d = [];
  SUITS.forEach(s => RANKS.forEach(r => d.push({ rank: r, suit: s, value: VALUES[r] })));
  return shuffle(d);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ── Card rendering ── */
function cardHTML(card, size = '') {
  const colorClass = IS_RED[card.suit] ? 'red' : 'black';
  const sizeClass  = size ? ' playing-card-' + size : '';
  return `
    <div class="playing-card${sizeClass} ${colorClass}">
      <div class="card-corner-top"><span class="c-rank">${card.rank}</span><span class="c-suit">${card.suit}</span></div>
      <div class="card-center">${card.suit}</div>
      <div class="card-corner-bottom"><span class="c-rank">${card.rank}</span><span class="c-suit">${card.suit}</span></div>
    </div>`.trim();
}

/* ── Game logic ── */
function newGame() {
  deck = buildDeck();
  currentCard = deck.pop();
  streak = 0;
  gameActive = true;

  document.getElementById('prevCard').innerHTML = '';
  document.getElementById('currentCard').innerHTML = cardHTML(currentCard, 'lg');
  document.getElementById('resultBadge').textContent = '?';
  document.getElementById('resultBadge').className = 'vs-divider';
  document.getElementById('feedbackMsg').classList.add('hidden');
  document.getElementById('guessButtons').classList.remove('hidden');
  document.getElementById('newGameBtn').classList.add('hidden');
  closeOverlay('gameOverOverlay');
  updateStats();
}

function guess(direction) {
  if (!gameActive || deck.length === 0) return;

  const prev = currentCard;
  const next = deck.pop();

  const correct =
    (direction === 'higher' && next.value >= prev.value) ||
    (direction === 'lower'  && next.value <= prev.value);

  const tie = next.value === prev.value;

  // Show previous card
  document.getElementById('prevCard').innerHTML = cardHTML(prev, 'lg');

  // Show current card
  document.getElementById('currentCard').innerHTML = cardHTML(next, 'lg');

  // Badge
  const badge = document.getElementById('resultBadge');
  if (tie) {
    badge.textContent = '=';
    badge.className = 'vs-divider tie';
  } else if (next.value > prev.value) {
    badge.textContent = '▲';
    badge.className = 'vs-divider higher';
  } else {
    badge.textContent = '▼';
    badge.className = 'vs-divider lower';
  }

  const feedback = document.getElementById('feedbackMsg');

  if (correct) {
    streak++;
    if (streak > best) best = streak;
    feedback.textContent = tie ? '😅 Lucky! Same value — that counts!' : '✅ Correct!';
    feedback.className = 'feedback-msg correct';
  } else {
    gameActive = false;
    feedback.textContent = '❌ Wrong! Game over.';
    feedback.className = 'feedback-msg wrong';
    document.getElementById('guessButtons').classList.add('hidden');
    document.getElementById('newGameBtn').classList.remove('hidden');
    showGameOver();
  }

  feedback.classList.remove('hidden');
  currentCard = next;
  updateStats();

  // Deck exhausted
  if (gameActive && deck.length === 0) {
    gameActive = false;
    setTimeout(() => {
      document.getElementById('guessButtons').classList.add('hidden');
      document.getElementById('newGameBtn').classList.remove('hidden');
      showGameOver(true);
    }, 800);
  }
}

function showGameOver(deckEmpty = false) {
  const savedBest = parseInt(localStorage.getItem('ihnc_hl_best') || '0');
  if (streak > savedBest) localStorage.setItem('ihnc_hl_best', streak);
  if (typeof recordStat === 'function') recordStat('hlBest', streak);

  const title = deckEmpty ? '🏆 Deck Complete!' : '💀 Game Over!';
  const msg = deckEmpty
    ? `You survived the whole deck with a streak of ${streak}!`
    : `You got ${streak} in a row. Best: ${Math.max(streak, savedBest)}.`;

  document.getElementById('gameOverTitle').textContent = title;
  document.getElementById('gameOverMsg').textContent = msg;

  document.getElementById('shareOverBtn').onclick = () => {
    shareResult(`🃏 Higher or Lower — I scored ${streak} in a row on ihavenocards.com!`);
  };

  openOverlay('gameOverOverlay');
}

function updateStats() {
  document.getElementById('streakVal').textContent = streak;
  const savedBest = parseInt(localStorage.getItem('ihnc_hl_best') || '0');
  document.getElementById('bestVal').textContent = Math.max(best, savedBest);
  document.getElementById('leftVal').textContent = deck.length;
}

/* ── How to Play ── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();
  trackGame('higher-lower');

  // Load best
  best = parseInt(localStorage.getItem('ihnc_hl_best') || '0');

  newGame();

  document.getElementById('howToPlayBtn').addEventListener('click', () => openOverlay('rulesOverlay'));
  document.getElementById('closeRulesBtn').addEventListener('click', () => closeOverlay('rulesOverlay'));
});
