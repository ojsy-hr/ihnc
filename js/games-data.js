/* ==========================================================
   ihavenocards — Central Game Manifest
   ========================================================== */

const GAMES = [
  // ── Card Games ────────────────────────────────────────────
  {
    id: 'higher-lower',
    name: 'Higher or Lower',
    emoji: '🃏',
    category: 'cards',
    players: '1+',
    description: 'Guess if the next card is higher or lower. Beat your streak!',
    url: '/pages/cards/higher-lower/',
    badge: 'new',
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    emoji: '🂡',
    category: 'cards',
    players: '1',
    description: 'Beat the dealer to 21 without going bust. Hit or stand?',
    url: '/pages/cards/blackjack/',
    badge: 'new',
  },
  {
    id: 'pontoon',
    name: 'Pontoon',
    emoji: '🂱',
    category: 'cards',
    players: '1',
    description: "Britain's twist on Blackjack — twist, buy, or stick to 21.",
    url: '/pages/cards/pontoon/',
    badge: 'new',
  },
  {
    id: 'snap',
    name: 'Snap',
    emoji: '👏',
    category: 'cards',
    players: '2',
    description: 'Flip cards and be the first to shout Snap when they match!',
    url: '/pages/cards/snap/',
    badge: 'new',
  },

  // ── Party Games ───────────────────────────────────────────
  {
    id: 'ring-of-fire',
    name: 'Ring of Fire',
    emoji: '🔥',
    category: 'party',
    players: '3+',
    description: 'Draw a card, follow the rule. The classic pub drinking game. Also known as Kings Cup.',
    url: '/pages/cards/ring-of-fire/',
    badge: 'new',
  },
  {
    id: 'ride-the-bus',
    name: 'Ride the Bus',
    emoji: '🚌',
    category: 'party',
    players: '2+',
    description: 'Guess colour, higher/lower, in/out, and suit. Wrong answer? Take a sip.',
    url: '/pages/cards/ride-the-bus/',
    badge: 'new',
  },

  // ── Darts ─────────────────────────────────────────────────
  {
    id: 'blind-killer',
    name: 'Blind Killer',
    emoji: '🎯',
    category: 'darts',
    players: '2–10',
    description: 'Draw a secret card. When your number gets hit on the board, you lose a life.',
    url: '/pages/darts/blind-killer/',
    badge: null,
  },
  {
    id: 'cricket',
    name: 'Cricket',
    emoji: '🎯',
    category: 'darts',
    players: '2–4',
    description: 'Close 20 down to 15 and Bull, score points, and outscore your rivals.',
    url: '/pages/darts/cricket/',
    badge: null,
  },
  {
    id: 'shanghai',
    name: 'Shanghai',
    emoji: '🎯',
    category: 'darts',
    players: '2–8',
    description: 'Target numbers 1–7 in order. Hit a Shanghai to win instantly.',
    url: '/pages/darts/shanghai/',
    badge: 'new',
  },
  {
    id: 'killer',
    name: 'Killer',
    emoji: '🎯',
    category: 'darts',
    players: '2–6',
    description: 'Pick your number, hit it 3 times to become a killer, then hunt down the rest.',
    url: '/pages/darts/killer/',
    badge: 'new',
  },

  // ── Pool ──────────────────────────────────────────────────
  {
    id: 'cutthroat',
    name: 'Cutthroat Pool',
    emoji: '🎱',
    category: 'pool',
    players: '3',
    description: "Three players, five balls each. Protect yours — pot everyone else's.",
    url: '/pages/pool/cutthroat/',
    badge: 'new',
  },
];

function getByCategory(cat) {
  return cat === 'all' ? GAMES : GAMES.filter(g => g.category === cat);
}

function getById(id) {
  return GAMES.find(g => g.id === id) || null;
}

function getSuggested(currentId, count = 3) {
  const current = getById(currentId);
  if (!current) return GAMES.slice(0, count);
  const same  = GAMES.filter(g => g.id !== currentId && g.category === current.category);
  const other = GAMES.filter(g => g.id !== currentId && g.category !== current.category);
  return [...same, ...other].slice(0, count);
}

function buildGameCard(game, baseUrl = '') {
  const badge = game.badge === 'new'
    ? '<span class="badge badge-new">New</span>'
    : game.badge === 'popular'
    ? '<span class="badge badge-popular">Popular</span>'
    : '';
  return `
    <a href="${baseUrl}${game.url}" class="game-card" data-category="${game.category}">
      <div class="game-card-emoji">${game.emoji}</div>
      <div class="game-card-name">${game.name}</div>
      <div class="game-card-desc">${game.description}</div>
      <div class="game-card-meta">
        <span class="badge">👥 ${game.players}</span>
        <span class="badge">${capitalize(game.category)}</span>
        ${badge}
      </div>
    </a>`.trim();
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
