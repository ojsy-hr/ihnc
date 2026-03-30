/* Pontoon — British Blackjack */

const SUITS  = ['♠', '♥', '♦', '♣'];
const RANKS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const IS_RED = { '♥': true, '♦': true, '♠': false, '♣': false };

let deck = [], playerHand = [], dealerHand = [], phase = 'idle', hasTwisted = false;
let stats = { wins: 0, losses: 0, push: 0 };

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

function drawCard(fd = false) {
  if (deck.length < 15) deck = [...deck, ...buildDeck()];
  const c = deck.pop(); c.faceDown = fd; return c;
}

function cardVal(rank) {
  if (['J','Q','K'].includes(rank)) return 10;
  if (rank === 'A') return 11;
  return parseInt(rank);
}

function handTotal(hand) {
  let t = 0, aces = 0;
  hand.forEach(c => {
    if (c.faceDown) return;
    t += cardVal(c.rank);
    if (c.rank === 'A') aces++;
  });
  while (t > 21 && aces > 0) { t -= 10; aces--; }
  return t;
}

function isBust(h) { return handTotal(h) > 21; }
function isPontoon(h) { return h.length === 2 && handTotal(h) === 21; }
function isFiveTrick(h) { return h.length === 5 && !isBust(h); }

function cardHTML(c) {
  if (c.faceDown) return '<div class="playing-card face-down"></div>';
  const cc = IS_RED[c.suit] ? 'red' : 'black';
  return `
    <div class="playing-card ${cc}">
      <div class="card-corner-top"><span class="c-rank">${c.rank}</span><span class="c-suit">${c.suit}</span></div>
      <div class="card-center">${c.suit}</div>
      <div class="card-corner-bottom"><span class="c-rank">${c.rank}</span><span class="c-suit">${c.suit}</span></div>
    </div>`;
}

function renderHands(revealDealer = false) {
  if (revealDealer) dealerHand.forEach(c => c.faceDown = false);
  document.getElementById('dealerHand').innerHTML = dealerHand.map(cardHTML).join('');
  document.getElementById('playerHand').innerHTML = playerHand.map(cardHTML).join('');

  const pt = handTotal(playerHand);
  const ps = document.getElementById('playerScore');
  if (isBust(playerHand)) { ps.textContent = `${pt} — Bust!`; ps.className = 'hand-score bust'; }
  else if (isPontoon(playerHand)) { ps.textContent = '21 — Pontoon!'; ps.className = 'hand-score bj'; }
  else if (isFiveTrick(playerHand)) { ps.textContent = `${pt} — Five Card Trick!`; ps.className = 'hand-score bj'; }
  else { ps.textContent = pt; ps.className = 'hand-score'; }

  const ds = document.getElementById('dealerScore');
  if (revealDealer) {
    const dt = handTotal(dealerHand);
    if (isBust(dealerHand)) { ds.textContent = `${dt} — Bust!`; ds.className = 'hand-score bust'; }
    else if (isPontoon(dealerHand)) { ds.textContent = '21 — Pontoon!'; ds.className = 'hand-score bj'; }
    else { ds.textContent = dt; ds.className = 'hand-score'; }
  } else {
    ds.textContent = '?'; ds.className = 'hand-score';
  }
}

function showResult(msg, type) {
  const el = document.getElementById('resultMsg');
  el.textContent = msg; el.className = 'feedback-msg ' + type;
  el.classList.remove('hidden');
}

function updateStats() {
  document.getElementById('winsVal').textContent   = stats.wins;
  document.getElementById('lossesVal').textContent = stats.losses;
  document.getElementById('pushVal').textContent   = stats.push;
}

function dealGame() {
  if (deck.length < 15) deck = buildDeck();
  playerHand = [drawCard(), drawCard()];
  dealerHand = [drawCard(), drawCard(true)];
  hasTwisted = false;
  phase = 'playing';

  document.getElementById('resultMsg').classList.add('hidden');
  document.getElementById('gameActions').classList.add('hidden');
  document.getElementById('playActions').classList.remove('hidden');
  document.getElementById('buyBtn').disabled = false;
  renderHands();

  if (isPontoon(playerHand)) setTimeout(() => endRound(), 400);
}

function playerTwist() {
  if (phase !== 'playing') return;
  hasTwisted = true;
  document.getElementById('buyBtn').disabled = true;
  playerHand.push(drawCard());
  renderHands();
  if (isBust(playerHand)) { endRound(); return; }
  if (isFiveTrick(playerHand)) { endRound(); return; }
  // Must have at most 4 cards to twist again
}

function playerBuy() {
  if (phase !== 'playing' || hasTwisted) return;
  playerHand.push(drawCard(false));
  renderHands();
  if (isBust(playerHand)) { endRound(); return; }
  if (isFiveTrick(playerHand)) { endRound(); return; }
  if (playerHand.length >= 5) { document.getElementById('buyBtn').disabled = true; }
}

function playerStick() {
  if (phase !== 'playing') return;
  if (handTotal(playerHand) < 15) {
    showResult('You must have at least 15 to stick.', 'info');
    return;
  }
  phase = 'dealer';
  bankerPlay();
}

function bankerPlay() {
  dealerHand.forEach(c => c.faceDown = false);
  renderHands(true);

  function hitStep() {
    if (handTotal(dealerHand) < 17) {
      dealerHand.push(drawCard());
      renderHands(true);
      setTimeout(hitStep, 500);
    } else { endRound(); }
  }
  setTimeout(hitStep, 600);
}

function endRound() {
  phase = 'idle';
  renderHands(true);

  const pt = handTotal(playerHand);
  const dt = handTotal(dealerHand);
  const pP = isPontoon(playerHand), dP = isPontoon(dealerHand);
  const pF = isFiveTrick(playerHand), dF = isFiveTrick(dealerHand);
  const pB = isBust(playerHand), dB = isBust(dealerHand);

  let msg, type;

  if (pB) {
    msg = '💀 Bust! You lose.'; type = 'wrong'; stats.losses++;
  } else if (pP && dP) {
    msg = '🤝 Both Pontoon — Banker wins on ties.'; type = 'wrong'; stats.losses++;
  } else if (pP) {
    msg = '🂡 Pontoon! You win!'; type = 'correct'; stats.wins++;
  } else if (dP) {
    msg = '😞 Banker has Pontoon. You lose.'; type = 'wrong'; stats.losses++;
  } else if (pF && dF) {
    msg = '🤝 Both Five Card Trick — Banker wins on ties.'; type = 'wrong'; stats.losses++;
  } else if (pF) {
    msg = '🃏 Five Card Trick! You win!'; type = 'correct'; stats.wins++;
  } else if (dF) {
    msg = '😞 Banker has Five Card Trick. You lose.'; type = 'wrong'; stats.losses++;
  } else if (dB) {
    msg = '🎉 Banker busts! You win!'; type = 'correct'; stats.wins++;
  } else if (pt > dt) {
    msg = `🎉 You win! ${pt} vs ${dt}.`; type = 'correct'; stats.wins++;
  } else if (pt === dt) {
    msg = `🤝 Tie — Banker wins on ties.`; type = 'wrong'; stats.losses++;
  } else {
    msg = `😞 Banker wins. ${dt} vs ${pt}.`; type = 'wrong'; stats.losses++;
  }

  showResult(msg, type);
  updateStats();
  document.getElementById('playActions').classList.add('hidden');
  document.getElementById('gameActions').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();
  trackGame('pontoon');
  deck = buildDeck();
  updateStats();

  document.getElementById('howToPlayBtn').addEventListener('click', () => openOverlay('rulesOverlay'));
  document.getElementById('closeRulesBtn').addEventListener('click', () => closeOverlay('rulesOverlay'));
});
