/* ==========================================================
   ihavenocards — Achievements System
   ========================================================== */

const ACH_KEY   = 'ihnc_achievements';
const STATS_KEY = 'ihnc_stats';

const ACHIEVEMENTS = [
  {
    id: 'first-game',
    emoji: '🎮',
    title: 'First Steps',
    desc: 'Play your first game.',
    check: s => s.gamesPlayed >= 1,
  },
  {
    id: 'explorer',
    emoji: '🗺️',
    title: 'Explorer',
    desc: 'Play 5 different games.',
    check: s => (s.uniqueGames || []).length >= 5,
  },
  {
    id: 'regular',
    emoji: '📅',
    title: 'Regular',
    desc: 'Play 10 times total.',
    check: s => s.gamesPlayed >= 10,
  },
  {
    id: 'card-shark',
    emoji: '🃏',
    title: 'Card Shark',
    desc: 'Play all 4 card games.',
    check: s => ['higher-lower','blackjack','pontoon','snap'].every(id => (s.uniqueGames||[]).includes(id)),
  },
  {
    id: 'pub-legend',
    emoji: '🍺',
    title: 'Pub Legend',
    desc: 'Play all party games.',
    check: s => ['ring-of-fire','ride-the-bus','never-have-i-ever','truth-or-dare'].every(id => (s.uniqueGames||[]).includes(id)),
  },
  {
    id: 'dartboard',
    emoji: '🎯',
    title: 'Dartboard',
    desc: 'Play all darts games.',
    check: s => ['blind-killer','cricket','shanghai','killer'].every(id => (s.uniqueGames||[]).includes(id)),
  },
  {
    id: 'hl-10',
    emoji: '🔥',
    title: 'On a Roll',
    desc: 'Get a streak of 10 in Higher or Lower.',
    check: s => (s.hlBest || 0) >= 10,
  },
  {
    id: 'hl-20',
    emoji: '💎',
    title: 'Unstoppable',
    desc: 'Get a streak of 20 in Higher or Lower.',
    check: s => (s.hlBest || 0) >= 20,
  },
  {
    id: 'bj-5',
    emoji: '🂡',
    title: 'Lucky Dealer',
    desc: 'Win 5 Blackjack hands.',
    check: s => (s.bjWins || 0) >= 5,
  },
  {
    id: 'bj-21',
    emoji: '👑',
    title: 'Blackjack Royalty',
    desc: 'Win 21 Blackjack hands.',
    check: s => (s.bjWins || 0) >= 21,
  },
  {
    id: 'rof-king',
    emoji: '♛',
    title: "King's Curse",
    desc: 'Draw all 4 Kings in Ring of Fire.',
    check: s => (s.rofKings || 0) >= 4,
  },
  {
    id: 'night-owl',
    emoji: '🌙',
    title: 'Night Owl',
    desc: 'Play a game between midnight and 4am.',
    check: s => s.nightOwl === true,
  },
  {
    id: 'sharer',
    emoji: '📤',
    title: 'Show Off',
    desc: 'Share a game result.',
    check: s => s.shared === true,
  },
  {
    id: 'completionist',
    emoji: '🏆',
    title: 'Completionist',
    desc: 'Unlock 10 achievements.',
    check: (s, unlocked) => unlocked.filter(id => id !== 'completionist' && id !== 'collector').length >= 10,
  },
  {
    id: 'collector',
    emoji: '🎖️',
    title: 'Collector',
    desc: 'Unlock every achievement.',
    check: (s, unlocked) => unlocked.filter(id => id !== 'collector').length >= ACHIEVEMENTS.length - 1,
  },
];

// ── Stats helpers ──────────────────────────────────────────

function getStats() {
  return Store.get(STATS_KEY, {
    gamesPlayed: 0,
    uniqueGames: [],
    hlBest: 0,
    bjWins: 0,
    rofKings: 0,
    nightOwl: false,
    shared: false,
  });
}

function saveStats(stats) {
  Store.set(STATS_KEY, stats);
}

function recordStat(key, value) {
  const stats = getStats();

  if (key === 'uniqueGames') {
    if (!Array.isArray(stats.uniqueGames)) stats.uniqueGames = [];
    if (!stats.uniqueGames.includes(value)) stats.uniqueGames.push(value);
  } else if (key === 'hlBest') {
    stats.hlBest = Math.max(stats.hlBest || 0, value);
  } else if (key === 'bjWins') {
    stats.bjWins = (stats.bjWins || 0) + 1;
  } else if (key === 'rofKings') {
    stats.rofKings = (stats.rofKings || 0) + 1;
  } else if (key === 'gamesPlayed') {
    stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
    // Night owl check
    const h = new Date().getHours();
    if (h >= 0 && h < 4) stats.nightOwl = true;
  } else if (key === 'shared') {
    stats.shared = true;
  } else {
    stats[key] = value;
  }

  saveStats(stats);
  checkAchievements();
}

// ── Achievement unlock checking ────────────────────────────

function checkAchievements() {
  const stats   = getStats();
  const unlocked = Store.get(ACH_KEY, []);
  let changed = false;

  ACHIEVEMENTS.forEach(ach => {
    if (unlocked.includes(ach.id)) return;
    try {
      if (ach.check(stats, unlocked)) {
        unlocked.push(ach.id);
        changed = true;
        showAchievementToast(ach);
      }
    } catch (_) {}
  });

  if (changed) Store.set(ACH_KEY, unlocked);
}

// ── Achievement toast ──────────────────────────────────────

function showAchievementToast(ach) {
  let toast = document.getElementById('achToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'achToast';
    toast.style.cssText = [
      'position:fixed',
      'bottom:2rem',
      'right:1rem',
      'background:var(--surface-raised)',
      'border:1px solid var(--accent)',
      'border-radius:var(--radius)',
      'padding:0.75rem 1rem',
      'max-width:220px',
      'z-index:9999',
      'box-shadow:0 4px 16px rgba(97,218,251,0.2)',
      'transform:translateX(260px)',
      'transition:transform 0.35s ease',
      'font-size:0.85rem',
      'line-height:1.4',
    ].join(';');
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <div style="font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin-bottom:0.25rem">Achievement Unlocked!</div>
    <div style="font-size:1.1rem;margin-bottom:0.2rem">${ach.emoji} <strong style="color:var(--text)">${ach.title}</strong></div>
    <div style="color:var(--text-muted)">${ach.desc}</div>
  `;

  clearTimeout(toast._t);
  // Slide in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
  });
  // Slide out after 4s
  toast._t = setTimeout(() => {
    toast.style.transform = 'translateX(260px)';
  }, 4000);
}

// ── Public helpers ─────────────────────────────────────────

function getUnlockedAchievements() {
  return Store.get(ACH_KEY, []);
}

function getAllAchievements() {
  return ACHIEVEMENTS;
}
