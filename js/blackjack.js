/* Blackjack */

const SUITS  = ['♠', '♥', '♦', '♣'];
const RANKS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const IS_RED = { '♥': true, '♦': true, '♠': false, '♣': false };

let deck = [], playerHand = [], dealerHand = [], phase = 'idle';
let stats = { wins: 0, losses: 0, push: 0 };

/* ── Deck helpers ── */
function buildDeck() {
  const d = [];
  SUITS.forEach(s => RANKS.forEach(r => d.push({ rank: r, suit: s, faceDown: false })));
  return shuffle(d);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function drawCard(faceDown = false) {
  if (deck.length < 15) deck = [...deck, ...buildDeck()];
  const card = deck.pop();
  card.faceDown = faceDown;
  return card;
}

/* ── Card value helpers ── */
function cardValue(rank) {
  if (['J','Q','K'].includes(rank)) return 10;
  if (rank === 'A') return 11;
  return parseInt(rank);
}

function handTotal(hand) {
  let total = 0, aces = 0;
  hand.forEach(c => {
    if (c.faceDown) return;
    total += cardValue(c.rank);
    if (c.rank === 'A') aces++;
  });
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function isBust(hand) { return handTotal(hand) > 21; }
function isBlackjack(hand) { return hand.length === 2 && handTotal(hand) === 21; }

/* ── Rendering ── */
function cardHTML(card) {
  if (card.faceDown) {
    return '<div class="playing-card face-down"></div>';
  }
  const cc = IS_RED[card.suit] ? 'red' : 'black';
  return `
    <div class="playing-card ${cc}">
      <div class="card-corner-top"><span class="c-rank">${card.rank}</span><span class="c-suit">${card.suit}</span></div>
      <div class="card-center">${card.suit}</div>
      <div class="card-corner-bottom"><span class="c-rank">${card.rank}</span><span class="c-suit">${card.suit}</span></div>
    </div>`;
}

function renderHands(revealDealer = false) {
  if (revealDealer) dealerHand.forEach(c => c.faceDown = false);

  document.getElementById('dealerHand').innerHTML = dealerHand.map(cardHTML).join('');
  document.getElementById('playerHand').innerHTML = playerHand.map(cardHTML).join('');

  const dt = revealDealer ? handTotal(dealerHand) : null;
  const pt = handTotal(playerHand);

  const ds = document.getElementById('dealerScore');
  ds.textContent = revealDealer ? (isBust(dealerHand) ? `${dt} — Bust!` : dt) : '?';
  ds.className = revealDealer && isBust(dealerHand) ? 'hand-score bust' : 'hand-score';

  const ps = document.getElementById('playerScore');
  ps.textContent = isBust(playerHand) ? `${pt} — Bust!` : isBlackjack(playerHand) ? '21 — Blackjack!' : pt;
  ps.className = isBust(playerHand) ? 'hand-score bust' : isBlackjack(playerHand) ? 'hand-score bj' : 'hand-score';
}

function showResult(msg, type) {
  const el = document.getElementById('resultMsg');
  el.textContent = msg;
  el.className = 'feedback-msg ' + type;
  el.classList.remove('hidden');
}

function updateStats() {
  document.getElementById('winsVal').textContent   = stats.wins;
  document.getElementById('lossesVal').textContent = stats.losses;
  document.getElementById('pushVal').textContent   = stats.push;
}

/* ── Game flow ── */
function dealGame() {
  if (deck.length < 15) deck = buildDeck();
  playerHand = [drawCard(), drawCard()];
  dealerHand = [drawCard(), drawCard(true)]; // second card face down

  phase = 'playing';
  document.getElementById('resultMsg').classList.add('hidden');
  document.getElementById('gameActions').classList.add('hidden');
  document.getElementById('playActions').classList.remove('hidden');
  document.getElementById('doubleBtn').disabled = false;

  renderHands();

  // Check player blackjack immediately
  if (isBlackjack(playerHand)) {
    setTimeout(() => endRound(), 400);
  }
}

function playerHit() {
  if (phase !== 'playing') return;
  playerHand.push(drawCard());
  document.getElementById('doubleBtn').disabled = true;
  renderHands();

  if (isBust(playerHand)) {
    endRound();
  }
}

function playerStand() {
  if (phase !== 'playing') return;
  phase = 'dealer';
  dealerPlay();
}

function playerDouble() {
  if (phase !== 'playing') return;
  playerHand.push(drawCard());
  renderHands();
  if (isBust(playerHand)) { endRound(); return; }
  phase = 'dealer';
  dealerPlay();
}

function dealerPlay() {
  dealerHand.forEach(c => c.faceDown = false);
  renderHands(true);

  // Dealer hits to soft 17
  function hitStep() {
    const dt = handTotal(dealerHand);
    if (dt < 17) {
      dealerHand.push(drawCard());
      renderHands(true);
      setTimeout(hitStep, 500);
    } else {
      endRound();
    }
  }
  setTimeout(hitStep, 600);
}

function endRound() {
  phase = 'idle';
  renderHands(true);

  const pt = handTotal(playerHand);
  const dt = handTotal(dealerHand);
  const playerBJ  = isBlackjack(playerHand);
  const dealerBJ  = isBlackjack(dealerHand);
  const playerBust = isBust(playerHand);
  const dealerBust = isBust(dealerHand);

  let msg, type;

  if (playerBust) {
    msg = '💀 Bust! You lose.'; type = 'wrong'; stats.losses++;
  } else if (playerBJ && dealerBJ) {
    msg = '🤝 Both Blackjack — Push!'; type = 'info'; stats.push++;
  } else if (playerBJ) {
    msg = '🂡 Blackjack! You win!'; type = 'correct'; stats.wins++;
  } else if (dealerBust) {
    msg = '🎉 Dealer busts! You win!'; type = 'correct'; stats.wins++;
  } else if (pt > dt) {
    msg = `🎉 You win! ${pt} vs ${dt}.`; type = 'correct'; stats.wins++;
  } else if (pt === dt) {
    msg = `🤝 Push! Both ${pt}.`; type = 'info'; stats.push++;
  } else {
    msg = `😞 Dealer wins. ${dt} vs ${pt}.`; type = 'wrong'; stats.losses++;
  }

  showResult(msg, type);
  updateStats();

  document.getElementById('playActions').classList.add('hidden');
  document.getElementById('gameActions').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();
  trackGame('blackjack');
  deck = buildDeck();
  updateStats();

  document.getElementById('howToPlayBtn').addEventListener('click', () => openOverlay('rulesOverlay'));
  document.getElementById('closeRulesBtn').addEventListener('click', () => closeOverlay('rulesOverlay'));
});
