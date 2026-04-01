/* Ring of Fire */

const ROF_DEFAULT_RULES = {
  'A':  { title: 'Waterfall 🌊', desc: "Everyone starts drinking. You can only stop when the person to your right stops — they can only stop when the person to their right stops, and so on." },
  '2':  { title: 'You 👉',       desc: "Choose any player to take a drink." },
  '3':  { title: 'Me 🤙',        desc: "You drink." },
  '4':  { title: 'Floor 🫳',     desc: "Last person to touch the floor drinks." },
  '5':  { title: 'Guys 🍺',      desc: "All guys drink." },
  '6':  { title: 'Chicks 🍷',    desc: "All girls drink." },
  '7':  { title: 'Heaven ☝️',    desc: "Last to point to the sky drinks." },
  '8':  { title: 'Mate 🤝',      desc: "Pick a drinking buddy. They drink whenever you do (and vice versa) until a new 8 is drawn." },
  '9':  { title: 'Rhyme 🎤',     desc: "Say a word. Go around the circle — each person must say a rhyming word. First to fail or repeat drinks." },
  '10': { title: 'Categories 📋',desc: "Name a category (e.g. 'Premier League clubs'). Go around — first person who can't think of one drinks." },
  'J':  { title: 'Make a Rule 📜',desc: "Create a rule that everyone must follow for the rest of the game. Anyone who breaks it drinks." },
  'Q':  { title: 'Question Master ❓', desc: "You are the Question Master until the next Queen is drawn. If anyone answers a question you ask them, they drink." },
  'K':  { title: "King's Cup 👑",  desc: "Pour some of your drink into the King's Cup (a glass in the centre). The person who draws the 4th King must drink the whole cup!" },
};

// Active rules — merged from defaults + any saved custom rules
let ROF_RULES = Object.assign({}, ROF_DEFAULT_RULES);

function loadCustomRules() {
  const saved = getSettings('ring-of-fire', {}).rules;
  if (saved) {
    ROF_RULES = {};
    Object.keys(ROF_DEFAULT_RULES).forEach(rank => {
      ROF_RULES[rank] = saved[rank]
        ? { title: saved[rank].title || ROF_DEFAULT_RULES[rank].title,
            desc:  saved[rank].desc  || ROF_DEFAULT_RULES[rank].desc }
        : Object.assign({}, ROF_DEFAULT_RULES[rank]);
    });
  }
  updateCustomBadge();
}

function updateCustomBadge() {
  const badge = document.getElementById('customRulesBadge');
  if (!badge) return;
  const saved = getSettings('ring-of-fire', {}).rules;
  if (!saved) { badge.classList.add('hidden'); return; }
  const isCustom = Object.keys(ROF_DEFAULT_RULES).some(rank =>
    saved[rank] &&
    (saved[rank].title !== ROF_DEFAULT_RULES[rank].title ||
     saved[rank].desc  !== ROF_DEFAULT_RULES[rank].desc)
  );
  badge.classList.toggle('hidden', !isCustom);
}

function openRulesEditor() {
  const container = document.getElementById('ruleEditorRows');
  const saved = getSettings('ring-of-fire', {}).rules || {};
  const MAX_DESC = 200;

  container.innerHTML = Object.keys(ROF_DEFAULT_RULES).map(rank => {
    const def = ROF_DEFAULT_RULES[rank];
    const cur = saved[rank] || def;
    const descLen = (cur.desc || '').length;
    return `
      <div class="rule-editor-row">
        <div class="rule-editor-row-header">
          <span class="rule-editor-rank">${rank}</span>
          <button class="rule-reset-btn" onclick="resetSingleRule('${rank}')">Reset to default</button>
        </div>
        <input class="rule-editor-input" id="rof-title-${rank}"
          type="text" value="${escRof(cur.title)}" placeholder="${escRof(def.title)}"
          aria-label="Rule name for ${rank}" />
        <textarea class="rule-editor-textarea" id="rof-desc-${rank}"
          maxlength="${MAX_DESC}" rows="2"
          oninput="rofDescCount('${rank}', ${MAX_DESC})"
          aria-label="Rule description for ${rank}"
          placeholder="${escRof(def.desc)}">${escRof(cur.desc)}</textarea>
        <div class="rule-char-count" id="rof-count-${rank}">${descLen} / ${MAX_DESC}</div>
      </div>`;
  }).join('');

  openOverlay('rulesEditorOverlay');
}

function rofDescCount(rank, max) {
  const ta = document.getElementById(`rof-desc-${rank}`);
  const counter = document.getElementById(`rof-count-${rank}`);
  if (!ta || !counter) return;
  const len = ta.value.length;
  counter.textContent = `${len} / ${max}`;
  counter.classList.toggle('over', len >= max);
}

function resetSingleRule(rank) {
  const def = ROF_DEFAULT_RULES[rank];
  const titleEl = document.getElementById(`rof-title-${rank}`);
  const descEl  = document.getElementById(`rof-desc-${rank}`);
  if (titleEl) titleEl.value = def.title;
  if (descEl)  { descEl.value = def.desc; rofDescCount(rank, 200); }
}

function saveCustomRules() {
  const rules = {};
  Object.keys(ROF_DEFAULT_RULES).forEach(rank => {
    const titleEl = document.getElementById(`rof-title-${rank}`);
    const descEl  = document.getElementById(`rof-desc-${rank}`);
    rules[rank] = {
      title: (titleEl ? titleEl.value.trim() : '') || ROF_DEFAULT_RULES[rank].title,
      desc:  (descEl  ? descEl.value.trim()  : '') || ROF_DEFAULT_RULES[rank].desc,
    };
  });
  saveSettings('ring-of-fire', { rules });
  loadCustomRules();
  closeOverlay('rulesEditorOverlay');
  showToast('House rules saved!');
}

function resetAllRules() {
  saveSettings('ring-of-fire', { rules: {} });
  ROF_RULES = Object.assign({}, ROF_DEFAULT_RULES);
  updateCustomBadge();
  closeOverlay('rulesEditorOverlay');
  showToast('Rules reset to defaults.');
}

function escRof(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const SUITS  = ['♠', '♥', '♦', '♣'];
const RANKS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const IS_RED = { '♥': true, '♦': true, '♠': false, '♣': false };

let deck = [], kingsDrawn = 0;

function buildDeck() {
  const d = [];
  SUITS.forEach(s => RANKS.forEach(r => d.push({ rank: r, suit: s })));
  return shuffle(d);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function newGame() {
  deck = buildDeck();
  kingsDrawn = 0;
  document.getElementById('ruleBox').classList.add('hidden');
  document.getElementById('deckPile').style.display = '';
  document.getElementById('deckCount').textContent = '52 cards remaining — tap to draw';
  document.getElementById('drawBtn').disabled = false;
  closeOverlay('gameOverOverlay');
}

function drawCard() {
  if (deck.length === 0) return;

  const card = deck.pop();
  const rule = ROF_RULES[card.rank];

  // Display card
  const colorClass = IS_RED[card.suit] ? 'red' : 'black';
  document.getElementById('drawnCardDisplay').innerHTML = `
    <div class="playing-card playing-card-lg ${colorClass}">
      <div class="card-corner-top"><span class="c-rank">${card.rank}</span><span class="c-suit">${card.suit}</span></div>
      <div class="card-center">${card.suit}</div>
      <div class="card-corner-bottom"><span class="c-rank">${card.rank}</span><span class="c-suit">${card.suit}</span></div>
    </div>`;

  document.getElementById('ruleTitle').textContent = rule.title;
  document.getElementById('ruleDesc').textContent  = rule.desc;
  document.getElementById('ruleBox').classList.remove('hidden');

  const remaining = deck.length;
  document.getElementById('deckCount').textContent = remaining === 0
    ? 'Deck empty!'
    : `${remaining} card${remaining === 1 ? '' : 's'} remaining`;

  if (remaining === 0) {
    document.getElementById('drawBtn').disabled = true;
  }

  // King logic
  if (card.rank === 'K') {
    kingsDrawn++;
    if (typeof recordStat === 'function') recordStat('rofKings', 1);
    if (kingsDrawn >= 4) {
      setTimeout(() => openOverlay('gameOverOverlay'), 600);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();
  loadCustomRules();
  trackGame('ring-of-fire');
  newGame();

  document.getElementById('howToPlayBtn').addEventListener('click', () => openOverlay('rulesOverlay'));
  document.getElementById('closeRulesBtn').addEventListener('click', () => closeOverlay('rulesOverlay'));
  document.getElementById('editRulesBtn').addEventListener('click', openRulesEditor);
});
