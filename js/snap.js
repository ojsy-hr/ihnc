/* Snap — pass-and-play two player */

const SUITS  = ['♠','♥','♦','♣'];
const RANKS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const IS_RED = { '♥':true,'♦':true,'♠':false,'♣':false };

let p1Deck = [], p2Deck = [], centrePile = [], currentPlayer = 1;
let lastCentreRank = null, snapAvailable = false;
let p1Name = 'Player 1', p2Name = 'Player 2';

function buildDeck() {
  const d = [];
  SUITS.forEach(s => RANKS.forEach(r => d.push({ rank:r, suit:s })));
  return shuffle(d);
}

function shuffle(arr) {
  for (let i = arr.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}

function cardHTML(card, size='') {
  const cc = IS_RED[card.suit] ? 'red' : 'black';
  const sz = size ? ' playing-card-'+size : '';
  return `
    <div class="playing-card${sz} ${cc}">
      <div class="card-corner-top"><span class="c-rank">${card.rank}</span><span class="c-suit">${card.suit}</span></div>
      <div class="card-center">${card.suit}</div>
      <div class="card-corner-bottom"><span class="c-rank">${card.rank}</span><span class="c-suit">${card.suit}</span></div>
    </div>`;
}

function startSnap() {
  p1Name = document.getElementById('p1Name').value.trim() || 'Player 1';
  p2Name = document.getElementById('p2Name').value.trim() || 'Player 2';

  const deck = buildDeck();
  p1Deck  = deck.slice(0, 26);
  p2Deck  = deck.slice(26);
  centrePile = [];
  currentPlayer = 1;
  snapAvailable = false;
  lastCentreRank = null;

  document.getElementById('setupSection').classList.add('hidden');
  document.getElementById('gameSection').classList.remove('hidden');
  document.getElementById('p1Label').textContent = p1Name;
  document.getElementById('p2Label').textContent = p2Name;

  renderGame();

  // Show cover for P1 to start
  showCover(`${p1Name}'s Turn`, `It's your turn — tap Ready when you're looking at the phone.`);
}

function setupNewGame() {
  document.getElementById('setupSection').classList.remove('hidden');
  document.getElementById('gameSection').classList.add('hidden');
  closeOverlay('winnerOverlay');
}

function renderGame() {
  const p1Top = p1Deck.length > 0 ? p1Deck[p1Deck.length-1] : null;
  const p2Top = p2Deck.length > 0 ? p2Deck[p2Deck.length-1] : null;
  const topCentre = centrePile.length > 0 ? centrePile[centrePile.length-1] : null;

  document.getElementById('p1CardSlot').innerHTML = p1Top
    ? '<div class="playing-card face-down"></div>'
    : '<div style="width:80px;height:112px;border:2px dashed var(--border);border-radius:7px;opacity:0.3"></div>';

  document.getElementById('p2CardSlot').innerHTML = p2Top
    ? '<div class="playing-card face-down"></div>'
    : '<div style="width:80px;height:112px;border:2px dashed var(--border);border-radius:7px;opacity:0.3"></div>';

  document.getElementById('centreSlot').innerHTML = topCentre
    ? cardHTML(topCentre)
    : '<div style="width:80px;height:112px;border:2px dashed var(--border);border-radius:7px;opacity:0.3"></div>';

  document.getElementById('p1Count').textContent = p1Deck.length + ' cards';
  document.getElementById('p2Count').textContent = p2Deck.length + ' cards';
  document.getElementById('centreCount').textContent = centrePile.length + ' cards';

  const name = currentPlayer === 1 ? p1Name : p2Name;
  document.getElementById('turnInfo').textContent = `${name}'s turn — tap Flip Card`;

  // SNAP available indicator
  const snapBtn = document.getElementById('snapBtn');
  if (snapAvailable) {
    snapBtn.classList.remove('inactive');
    snapBtn.classList.add('active');
  } else {
    snapBtn.classList.add('inactive');
    snapBtn.classList.remove('active');
  }
}

function flipCard() {
  const currentDeck = currentPlayer === 1 ? p1Deck : p2Deck;
  if (currentDeck.length === 0) {
    checkWinner();
    return;
  }

  const card = currentDeck.pop();
  centrePile.push(card);

  // Check snap condition
  if (lastCentreRank && card.rank === lastCentreRank) {
    snapAvailable = true;
  } else {
    snapAvailable = false;
  }
  lastCentreRank = card.rank;

  renderGame();

  if (snapAvailable) {
    // Don't advance turn — both players can snap
    document.getElementById('flipBtn').disabled = true;
    document.getElementById('turnInfo').textContent = '👀 SNAP opportunity! First to tap wins!';
  } else {
    // Pass to other player
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    const nextName = currentPlayer === 1 ? p1Name : p2Name;
    // Show cover screen for next player
    showCover(
      `Pass the phone to ${nextName}`,
      "Hand the phone over — they'll tap Ready when they're looking."
    );
  }
}

function callSnap() {
  if (!snapAvailable) return;
  snapAvailable = false;

  // The current player who tapped SNAP gets the centre pile
  // (since we didn't advance currentPlayer yet when snap is available)
  const winner = currentPlayer;
  const winnerDeck = winner === 1 ? p1Deck : p2Deck;
  winnerDeck.unshift(...centrePile);
  centrePile = [];
  lastCentreRank = null;

  document.getElementById('flipBtn').disabled = false;
  renderGame();

  const winnerName = winner === 1 ? p1Name : p2Name;
  document.getElementById('turnInfo').textContent = `🎉 ${winnerName} wins the pile!`;

  // Now advance to other player's turn after a moment
  currentPlayer = winner === 1 ? 2 : 1;
  const nextName = currentPlayer === 1 ? p1Name : p2Name;
  setTimeout(() => {
    showCover(`Pass to ${nextName}`, "Hand the phone over — they'll tap Ready when they're looking.");
  }, 1200);
}

function checkWinner() {
  if (p1Deck.length === 0 && p2Deck.length === 0) {
    // both empty — whoever has centre pile cards wins
    showWinner('Draw! The deck is empty.');
    return;
  }
  if (p1Deck.length === 0) showWinner(`${p2Name} wins! ${p1Name} ran out of cards.`);
  if (p2Deck.length === 0) showWinner(`${p1Name} wins! ${p2Name} ran out of cards.`);
}

function showWinner(msg) {
  document.getElementById('snapWinnerMsg').textContent = msg;
  openOverlay('winnerOverlay');
}

/* Cover screen */
function showCover(title, msg) {
  document.getElementById('coverTitle').textContent = title;
  document.getElementById('coverMsg').textContent   = msg;
  document.getElementById('coverScreen').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();
  trackGame('snap');

  document.getElementById('coverReadyBtn').addEventListener('click', () => {
    document.getElementById('coverScreen').classList.add('hidden');
    renderGame();
  });

  document.getElementById('howToPlayBtn').addEventListener('click', () => openOverlay('rulesOverlay'));
  document.getElementById('closeRulesBtn').addEventListener('click', () => closeOverlay('rulesOverlay'));

  // Save player names
  const saved = getSavedNames();
  if (saved[0]) document.getElementById('p1Name').value = saved[0];
  if (saved[1]) document.getElementById('p2Name').value = saved[1];
});
