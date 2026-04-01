/* Never Have I Ever */

const NHIE_STATEMENTS = {
  mild: [
    "eaten a whole pizza by myself",
    "stayed up past 3am for no reason",
    "pretended to be busy to avoid someone",
    "re-gifted a present",
    "eaten food off the floor",
    "lied about reading a book",
    "fallen asleep in a cinema",
    "eaten cereal as a meal at dinner",
    "forgotten someone's name mid-conversation",
    "accidentally liked an old photo while stalking someone",
    "sent a message to the wrong person",
    "cried at an advert",
    "googled myself",
    "pretended not to hear someone to avoid talking",
    "eaten something just because it was free",
    "talked to a pet like it was a human",
    "spent over an hour choosing what to watch",
    "binge-watched an entire series in one day",
    "burned something while cooking",
    "worn the same outfit two days in a row",
    "used someone else's Netflix without telling them",
    "taken a selfie in a changing room",
    "bought something just because it was on sale",
    "pretended to be on the phone to avoid a conversation",
    "lied about my age",
    "said I'd be there in 5 minutes when I hadn't left yet",
    "eaten breakfast food for dinner",
    "talked about the weather to fill an awkward silence",
    "pretended to laugh at a joke I didn't get",
    "fallen asleep during a zoom call",
  ],
  spicy: [
    "ghosted someone I actually liked",
    "fancied a friend's partner",
    "snooped through someone's phone",
    "talked about someone behind their back and regretted it",
    "cancelled plans because I just didn't feel like it",
    "lied on my CV",
    "kissed someone I shouldn't have",
    "drunk-texted an ex",
    "slid into someone's DMs",
    "lied to get out of work",
    "cheated in a game and got away with it",
    "pretended to be more drunk than I was",
    "had a crush on a teacher or boss",
    "made out with someone whose name I didn't know",
    "sent a risky photo",
    "lied about where I was",
    "stolen something (even small)",
    "flirted to get something for free",
    "faked being sick to get out of something important",
    "talked my way out of a fine or ticket",
    "been caught snooping",
    "matched with someone on a dating app and never messaged",
    "been blocked by someone without knowing why",
    "said 'I love you' without meaning it",
    "woken up somewhere and not known how I got there",
    "kissed two people on the same night",
    "had a secret relationship",
    "regretted something I posted online",
    "blamed someone else for something I did",
    "accidentally walked in on someone",
  ],
  wild: [
    "done something illegal and never got caught",
    "hooked up with someone at a work event",
    "been thrown out of a venue",
    "woken up with no memory of the night before",
    "skinny dipped",
    "been in a physical fight",
    "been arrested or cautioned",
    "slept with more than 10 people",
    "done a walk of shame",
    "had a one-night stand with someone I'd just met",
    "hooked up with someone way older or younger than me",
    "kissed someone in this room",
    "been caught in a lie that seriously backfired",
    "done something on a dare I deeply regret",
    "made out with someone's sibling",
    "gone home with someone I met that same evening",
    "had a secret that would shock everyone in this room",
    "been so drunk I cried in public",
    "done something in public that should stay private",
    "had a situationship that no one knew about",
    "got with someone within an hour of meeting them",
    "lied about being single",
    "hooked up in a car",
    "sent a message meant for one person to a group chat",
    "passed out at a party before midnight",
    "done a streak",
    "made out in a taxi",
    "had feelings for two people at the same time",
    "dated someone just for the free meals",
    "used someone to make an ex jealous",
  ],
};

let deck = [];
let currentIndex = 0;
let selectedVibe = 'mix';
let players = [];

function buildDeck(vibe) {
  let pool = [];
  if (vibe === 'mix') {
    pool = [...NHIE_STATEMENTS.mild, ...NHIE_STATEMENTS.spicy, ...NHIE_STATEMENTS.wild];
  } else {
    pool = [...NHIE_STATEMENTS[vibe]];
  }
  // shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

function updatePlayerInputs(count) {
  document.getElementById('numPlayersDisplay').textContent = count;
  const container = document.getElementById('playerNameInputs');
  const saved = getSavedNames();
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = `Player ${i + 1}`;
    inp.value = saved[i] || '';
    inp.style.cssText = 'width:100%;padding:0.55rem 0.8rem;border-radius:var(--radius);border:1px solid var(--border);background:var(--surface-raised);color:var(--text);font-family:inherit;font-size:0.95rem;margin-bottom:0.5rem;user-select:text;';
    container.appendChild(inp);
  }
}

function startGame() {
  const count = parseInt(document.getElementById('numPlayers').value);
  const inputs = document.querySelectorAll('#playerNameInputs input');
  players = Array.from(inputs).map((inp, i) => inp.value.trim() || `Player ${i + 1}`);
  saveNames(players);

  deck = buildDeck(selectedVibe);
  currentIndex = 0;

  document.getElementById('setupSection').classList.add('hidden');
  document.getElementById('doneSection').classList.add('hidden');
  document.getElementById('gameSection').classList.remove('hidden');

  renderCard();
  renderPlayerButtons();
  trackGame('never-have-i-ever');
  if (typeof recordStat === 'function') recordStat('gamesPlayed', 1);
  if (typeof recordStat === 'function') recordStat('uniqueGames', 'never-have-i-ever');
}

function renderCard() {
  if (currentIndex >= deck.length) {
    showDone();
    return;
  }
  document.getElementById('statementText').textContent = deck[currentIndex];
  document.getElementById('cardCounter').textContent = `${currentIndex + 1} / ${deck.length}`;
  resetPlayerButtons();
}

function nextCard() {
  currentIndex++;
  renderCard();
}

function reshuffleRemaining() {
  const remaining = deck.slice(currentIndex);
  for (let i = remaining.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
  }
  deck = [...deck.slice(0, currentIndex), ...remaining];
  renderCard();
}

function renderPlayerButtons() {
  const container = document.getElementById('playerButtons');
  container.innerHTML = players.map((name, i) =>
    `<button class="nhie-player-btn" data-index="${i}" onclick="togglePlayer(this)">${name}</button>`
  ).join('');
}

function resetPlayerButtons() {
  document.querySelectorAll('.nhie-player-btn').forEach(btn => btn.classList.remove('done'));
}

function togglePlayer(btn) {
  btn.classList.toggle('done');
}

function showDone() {
  document.getElementById('gameSection').classList.add('hidden');
  document.getElementById('doneSection').classList.remove('hidden');
}

function restartGame() {
  deck = buildDeck(selectedVibe);
  currentIndex = 0;
  document.getElementById('doneSection').classList.add('hidden');
  document.getElementById('gameSection').classList.remove('hidden');
  renderCard();
  renderPlayerButtons();
}

function backToSetup() {
  document.getElementById('doneSection').classList.add('hidden');
  document.getElementById('gameSection').classList.add('hidden');
  document.getElementById('setupSection').classList.remove('hidden');
}

function endGame() {
  document.getElementById('gameSection').classList.add('hidden');
  document.getElementById('setupSection').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  const slider = document.getElementById('numPlayers');
  slider.addEventListener('input', () => updatePlayerInputs(slider.value));
  updatePlayerInputs(slider.value);

  document.querySelectorAll('[data-vibe]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-vibe]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedVibe = btn.dataset.vibe;
    });
  });

  document.getElementById('startBtn').addEventListener('click', startGame);

  document.getElementById('howToPlayBtn').addEventListener('click', () => openOverlay('rulesOverlay'));
  document.getElementById('closeRulesBtn').addEventListener('click', () => closeOverlay('rulesOverlay'));

  // Keyboard support on card
  document.getElementById('nhieCard').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextCard(); }
  });
});
