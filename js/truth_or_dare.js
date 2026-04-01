/* Truth or Dare */

const TOD_CONTENT = {
  truths: {
    mild: [
      "What's the most embarrassing thing that's happened to you in public?",
      "What's a habit you have that you'd be embarrassed if people knew about?",
      "Have you ever pretended to be sick to get out of something?",
      "What's the worst gift you've ever received?",
      "Have you ever blamed someone else for something you did?",
      "What's the most childish thing you still do?",
      "Have you ever lied to avoid going to a social event?",
      "What's the weirdest thing you've eaten?",
      "Have you ever sent a message to the wrong person?",
      "What's your biggest irrational fear?",
      "What song do you secretly love but won't admit to?",
      "Have you ever walked into something because you were on your phone?",
      "What's the longest you've gone without showering?",
      "Have you ever cried at a film you'd never admit to?",
      "What's the most embarrassing thing on your search history?",
    ],
    spicy: [
      "Who in this room would you most want to kiss?",
      "What's the worst thing you've ever done and gotten away with?",
      "Have you ever had feelings for a friend's partner?",
      "What's the biggest lie you've ever told someone close to you?",
      "Have you ever stalked an ex on social media?",
      "Who was your most regrettable kiss?",
      "Have you ever cheated on someone?",
      "What's the most embarrassing thing you've done while drunk?",
      "Have you ever fancied someone much older or younger than you?",
      "What's a secret you've never told anyone in this room?",
      "Have you ever rejected someone and felt bad about how you did it?",
      "What's the pettiest thing you've ever done for revenge?",
      "Have you ever snooped through someone's messages?",
      "What's the most desperate thing you've done to get someone's attention?",
      "Have you ever said 'I love you' without meaning it?",
    ],
    wild: [
      "What's the most scandalous thing you've done that no one knows about?",
      "Have you ever hooked up with someone in this room?",
      "What's the worst lie you've told a partner?",
      "Have you ever done something illegal that you'd never admit to your parents?",
      "Who in this room do you find most attractive, and why?",
      "What's the most embarrassing thing that's happened during a hook-up?",
      "Have you ever faked it?",
      "What's the wildest place you've ever hooked up?",
      "Have you ever had feelings for two people at the same time?",
      "What's the most desperate thing you've done for someone you fancied?",
    ],
  },
  dares: {
    mild: [
      "Do your best impression of someone in this room.",
      "Talk in an accent for the next two rounds.",
      "Let the group go through your camera roll for 30 seconds.",
      "Do 10 push-ups right now.",
      "Sing the chorus of the last song you listened to.",
      "Show the last photo you took.",
      "Let someone in the group post a story on your Instagram.",
      "Do your best celebrity impression.",
      "Show your most recent text conversation.",
      "Do a 30-second dance with no music.",
      "Call someone in your contacts and sing them happy birthday.",
      "Let the group read your last 5 sent messages.",
      "Speak in a whisper for the next 3 rounds.",
      "Do your best catwalk across the room.",
      "Imitate someone's laugh in the group — they have to guess who.",
    ],
    spicy: [
      "Text your ex 'I miss you' — actually send it.",
      "Let someone in the group send one message from your phone.",
      "Do a 60-second impression of the person to your left.",
      "Tell everyone your honest first impression of the person to your right.",
      "Let someone in the group change your profile picture for 10 minutes.",
      "Post a throwback photo on your story right now.",
      "Reveal the last person you searched on social media.",
      "Let the group read your most recent DM conversation.",
      "Tell the group the last white lie you told.",
      "Send a risky compliment to your most recent chat.",
      "Do your best flirty impression and direct it at someone in the room.",
      "Show the group your notes app — they pick one to read aloud.",
      "Confess something you've never told anyone in this room.",
      "Text someone you haven't spoken to in over a year.",
      "Let the group pick a contact and you have to voice note them.",
    ],
    wild: [
      "Lick your elbow — seriously, try it.",
      "Let the group write a status and post it on your Facebook.",
      "Call someone you've not spoken to in a year and say 'we need to talk'.",
      "Let someone draw on your face with a pen.",
      "Do your best impression of the person to your right — but make it dramatic.",
      "Text your crush right now.",
      "Do a plank for 45 seconds while someone tells a story.",
      "Let the person to your left go through your search history.",
      "Post the most embarrassing photo of yourself you can find.",
      "Let the group pick a contact and call them on speaker.",
    ],
  },
};

let todTruths = [];
let todDares = [];
let todTruthIdx = 0;
let todDareIdx = 0;
let todPlayers = [];
let todCurrentPlayer = 0;
let todSelectedVibe = 'mix';
let todFlipped = false;

function buildTodDecks(vibe) {
  const vibes = vibe === 'mix' ? ['mild', 'spicy', 'wild'] : [vibe];
  let truths = [];
  let dares = [];
  vibes.forEach(v => {
    truths = truths.concat(TOD_CONTENT.truths[v] || []);
    dares  = dares.concat(TOD_CONTENT.dares[v]  || []);
  });
  shuffle(truths);
  shuffle(dares);
  return { truths, dares };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
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
  todPlayers = Array.from(inputs).map((inp, i) => inp.value.trim() || `Player ${i + 1}`);
  saveNames(todPlayers);

  const decks = buildTodDecks(todSelectedVibe);
  todTruths = decks.truths;
  todDares  = decks.dares;
  todTruthIdx = 0;
  todDareIdx  = 0;
  todCurrentPlayer = 0;
  todFlipped = false;

  document.getElementById('setupSection').classList.add('hidden');
  document.getElementById('gameSection').classList.remove('hidden');

  setPlayerLabel();
  updateCounters();
  resetCard();

  trackGame('truth-or-dare');
  if (typeof recordStat === 'function') recordStat('gamesPlayed', 1);
  if (typeof recordStat === 'function') recordStat('uniqueGames', 'truth-or-dare');
}

function setPlayerLabel() {
  document.getElementById('currentPlayerLabel').textContent =
    `${todPlayers[todCurrentPlayer]}'s turn`;
}

function updateCounters() {
  const tr = Math.max(0, todTruths.length - todTruthIdx);
  const dr = Math.max(0, todDares.length - todDareIdx);
  document.getElementById('truthsLeft').textContent = `${tr} truth${tr !== 1 ? 's' : ''} left`;
  document.getElementById('daresLeft').textContent  = `${dr} dare${dr !== 1 ? 's' : ''} left`;
}

function resetCard() {
  todFlipped = false;
  const inner = document.getElementById('todCardInner');
  inner.classList.remove('flipped');
  document.getElementById('todActions').classList.add('hidden');
  document.getElementById('todChoosePrompt').classList ?
    document.getElementById('todChoosePrompt').style.display = '' : null;
}

function pickType(type) {
  if (todFlipped) return;

  let text = '';
  if (type === 'truth') {
    if (todTruthIdx >= todTruths.length) {
      showToast('No more truths! Reshuffle or pick dare.');
      return;
    }
    text = todTruths[todTruthIdx++];
    document.getElementById('todTypeLabel').textContent = 'TRUTH';
    document.getElementById('todTypeLabel').className = 'tod-type-label tod-type-truth';
  } else {
    if (todDareIdx >= todDares.length) {
      showToast('No more dares! Reshuffle or pick truth.');
      return;
    }
    text = todDares[todDareIdx++];
    document.getElementById('todTypeLabel').textContent = 'DARE';
    document.getElementById('todTypeLabel').className = 'tod-type-label tod-type-dare';
  }

  document.getElementById('todText').textContent = text;
  document.getElementById('todCardInner').classList.add('flipped');
  document.getElementById('todActions').classList.remove('hidden');
  document.getElementById('todChoosePrompt').style.display = 'none';
  todFlipped = true;
  updateCounters();
}

function nextTurn() {
  todCurrentPlayer = (todCurrentPlayer + 1) % todPlayers.length;
  setPlayerLabel();
  resetCard();
}

function passTurn() {
  showToast(`${todPlayers[todCurrentPlayer]} passes — take a sip! 🍺`);
  nextTurn();
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
      todSelectedVibe = btn.dataset.vibe;
    });
  });

  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('howToPlayBtn').addEventListener('click', () => openOverlay('rulesOverlay'));
  document.getElementById('closeRulesBtn').addEventListener('click', () => closeOverlay('rulesOverlay'));
});
