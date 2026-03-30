/* Ride the Bus */

const SUITS  = ['♠','♥','♦','♣'];
const RANKS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const VALUES = { A:1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,J:11,Q:12,K:13 };
const IS_RED = { '♥':true,'♦':true,'♠':false,'♣':false };

let deck = [], players = [], currentPlayerIdx = 0;
let roundCards = [], currentRound = 1, sips = 0;

function buildDeck() {
  const d = [];
  SUITS.forEach(s => RANKS.forEach(r => d.push({ rank:r, suit:s, value: VALUES[r] })));
  return shuffle(d);
}

function shuffle(arr) {
  for (let i = arr.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}

/* ── Setup ── */
function updatePlayerInputs(n) {
  document.getElementById('numPlayersDisplay').textContent = n;
  const container = document.getElementById('playerNameInputs');
  const current = container.querySelectorAll('input');
  const count = parseInt(n);

  if (count > current.length) {
    for (let i = current.length; i < count; i++) {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.placeholder = `Player ${i+1} name`;
      inp.style.cssText = 'width:100%;padding:0.5rem 0.75rem;border-radius:var(--radius);border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:1rem;font-family:inherit;margin-bottom:0.4rem;display:block;';
      container.appendChild(inp);
    }
  } else {
    while (container.children.length > count) container.removeChild(container.lastChild);
  }
}

function startGame() {
  const inputs = document.querySelectorAll('#playerNameInputs input');
  players = Array.from(inputs).map((inp,i) => ({
    name: inp.value.trim() || `Player ${i+1}`,
    totalSips: 0
  }));

  if (players.length === 0) players = [{ name: 'Player 1', totalSips: 0 }];

  deck = buildDeck();
  currentPlayerIdx = 0;
  document.getElementById('playerSetup').classList.add('hidden');
  document.getElementById('gameSection').classList.remove('hidden');

  startPlayerTurn();
}

function startPlayerTurn() {
  roundCards = [];
  currentRound = 1;
  sips = 0;
  updateHeader();
  nextRound();
}

function updateHeader() {
  document.getElementById('currentPlayerName').textContent = players[currentPlayerIdx].name;
  document.getElementById('roundNum').textContent = currentRound;
  document.getElementById('sipsVal').textContent = sips;
}

function drawNextCard() {
  if (deck.length === 0) deck = buildDeck();
  return deck.pop();
}

function cardHTML(card, size='') {
  const cc = IS_RED[card.suit] ? 'red' : 'black';
  const sz = size ? ' playing-card-'+size : '';
  return `<div class="playing-card${sz} ${cc}">
    <div class="card-corner-top"><span class="c-rank">${card.rank}</span><span class="c-suit">${card.suit}</span></div>
    <div class="card-center">${card.suit}</div>
    <div class="card-corner-bottom"><span class="c-rank">${card.rank}</span><span class="c-suit">${card.suit}</span></div>
  </div>`;
}

function renderCards() {
  document.getElementById('cardRow').innerHTML = roundCards.map(c => cardHTML(c)).join('');
}

function setButtons(btns) {
  const container = document.getElementById('answerButtons');
  container.innerHTML = btns.map(b =>
    `<button class="btn ${b.style || 'btn-outline'}" onclick="answer('${b.value}')">${b.label}</button>`
  ).join('');
}

function nextRound() {
  document.getElementById('rtbFeedback').classList.add('hidden');
  updateHeader();

  const roundLabels = ['Round 1 of 4', 'Round 2 of 4', 'Round 3 of 4', 'Round 4 of 4'];
  document.getElementById('roundLabel').textContent = roundLabels[currentRound - 1] || '';

  switch (currentRound) {
    case 1:
      document.getElementById('questionText').textContent = '🔴⚫ Red or Black?';
      setButtons([
        { label: '🔴 Red', value: 'red', style: 'btn-outline' },
        { label: '⚫ Black', value: 'black', style: 'btn-ghost' }
      ]);
      break;
    case 2:
      document.getElementById('questionText').textContent = `⬆⬇ Higher or Lower than ${roundCards[0].rank}?`;
      setButtons([
        { label: '⬆ Higher', value: 'higher', style: 'btn-primary' },
        { label: '⬇ Lower', value: 'lower', style: 'btn-outline' }
      ]);
      break;
    case 3: {
      const lo = Math.min(roundCards[0].value, roundCards[1].value);
      const hi = Math.max(roundCards[0].value, roundCards[1].value);
      document.getElementById('questionText').textContent = `↔ Inside (${roundCards[0].rank}–${roundCards[1].rank}) or Outside?`;
      setButtons([
        { label: '↔ Inside', value: 'inside', style: 'btn-outline' },
        { label: '↕ Outside', value: 'outside', style: 'btn-ghost' }
      ]);
      break;
    }
    case 4:
      document.getElementById('questionText').textContent = '♠♥♦♣ What suit?';
      setButtons([
        { label: '♠ Spades', value: '♠', style: 'btn-ghost' },
        { label: '♥ Hearts', value: '♥', style: 'btn-outline' },
        { label: '♦ Diamonds', value: '♦', style: 'btn-outline' },
        { label: '♣ Clubs', value: '♣', style: 'btn-ghost' }
      ]);
      break;
  }
}

function answer(choice) {
  const card = drawNextCard();
  roundCards.push(card);
  renderCards();

  let correct = false;
  let msg = '';

  switch (currentRound) {
    case 1:
      correct = (choice === 'red') === IS_RED[card.suit];
      msg = correct ? `✅ Correct! It was ${IS_RED[card.suit] ? 'Red' : 'Black'}.` : `❌ Wrong! It was ${IS_RED[card.suit] ? 'Red' : 'Black'}.`;
      break;
    case 2:
      correct = choice === 'higher'
        ? card.value > roundCards[0].value
        : card.value < roundCards[0].value;
      if (card.value === roundCards[0].value) correct = false;
      msg = correct ? `✅ Correct! ${card.rank} is ${choice}.` : `❌ Wrong! ${card.rank} was ${card.value > roundCards[0].value ? 'Higher' : (card.value === roundCards[0].value ? 'Equal (Lower)' : 'Lower')}.`;
      break;
    case 3: {
      const lo = Math.min(roundCards[0].value, roundCards[1].value);
      const hi = Math.max(roundCards[0].value, roundCards[1].value);
      const inside = card.value > lo && card.value < hi;
      correct = (choice === 'inside') === inside;
      msg = correct ? `✅ Correct! ${card.rank} is ${inside ? 'Inside' : 'Outside'}.` : `❌ Wrong! ${card.rank} was ${inside ? 'Inside' : 'Outside'}.`;
      break;
    }
    case 4:
      correct = card.suit === choice;
      msg = correct ? `✅ Correct! It was ${card.suit}.` : `❌ Wrong! It was ${card.suit}.`;
      break;
  }

  const fb = document.getElementById('rtbFeedback');
  fb.textContent = msg;
  fb.className = 'feedback-msg ' + (correct ? 'correct' : 'wrong');
  fb.classList.remove('hidden');

  document.getElementById('answerButtons').innerHTML = '';

  if (correct) {
    if (currentRound === 4) {
      // Player completed all 4! Next player
      setTimeout(() => {
        const total = players.reduce((sum, p) => sum + p.totalSips, 0);
        const nextBtn = `<button class="btn btn-primary btn-lg" onclick="nextPlayer()">Next Player ➡</button>`;
        document.getElementById('answerButtons').innerHTML = nextBtn;
        fb.textContent = `🎉 ${players[currentPlayerIdx].name} completed all 4 rounds! Total sips: ${players[currentPlayerIdx].totalSips}`;
      }, 800);
    } else {
      currentRound++;
      updateHeader();
      setTimeout(() => nextRound(), 900);
    }
  } else {
    sips++;
    players[currentPlayerIdx].totalSips += 1;
    updateHeader();
    setTimeout(() => {
      fb.textContent = `😅 Take a sip! Starting over from Round 1…`;
      roundCards = [];
      renderCards();
      currentRound = 1;
      setTimeout(() => nextRound(), 1200);
    }, 1200);
  }
}

function nextPlayer() {
  currentPlayerIdx = (currentPlayerIdx + 1) % players.length;
  startPlayerTurn();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();
  trackGame('ride-the-bus');
  updatePlayerInputs(2);

  document.getElementById('numPlayers').addEventListener('input', e => updatePlayerInputs(e.target.value));
  document.getElementById('howToPlayBtn').addEventListener('click', () => openOverlay('rulesOverlay'));
  document.getElementById('closeRulesBtn').addEventListener('click', () => closeOverlay('rulesOverlay'));
});
