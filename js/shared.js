/* ==========================================================
   ihavenocards — Shared JavaScript
   ========================================================== */

// ── Theme ──────────────────────────────────────────────────
const THEME_KEY = 'ihnc_theme';

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ── Nav Toggle ─────────────────────────────────────────────
function initNav() {
  const toggleBtn = document.querySelector('.nav-toggle');
  const navLinks  = document.querySelector('.nav-links');
  if (!toggleBtn || !navLinks) return;

  toggleBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('show');
    toggleBtn.setAttribute('aria-expanded', String(open));
    navLinks.setAttribute('aria-hidden', String(!open));
  });

  document.addEventListener('click', (e) => {
    if (!toggleBtn.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('show');
      toggleBtn.setAttribute('aria-expanded', 'false');
      navLinks.setAttribute('aria-hidden', 'true');
    }
  });
}

// ── Sound Manager ──────────────────────────────────────────
const SoundManager = {
  enabled: true,
  cache: {},

  init() {
    const saved = localStorage.getItem('ihnc_sound');
    this.enabled = saved === null ? true : saved === 'true';
  },

  setEnabled(val) {
    this.enabled = Boolean(val);
    localStorage.setItem('ihnc_sound', String(this.enabled));
  },

  play(name, base) {
    if (!this.enabled) return;
    try {
      const path = (base || '/assets/sounds/') + name + '.wav';
      if (!this.cache[name]) {
        this.cache[name] = new Audio(path);
        this.cache[name].preload = 'auto';
      }
      const a = this.cache[name].cloneNode();
      a.play().catch(() => {});
    } catch (_) {}
  }
};

// ── Overlay Helpers ────────────────────────────────────────
function openOverlay(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');
  el.removeAttribute('aria-hidden');
  const focusable = el.querySelector('button, [href], input, [tabindex]:not([tabindex="-1"])');
  if (focusable) setTimeout(() => focusable.focus(), 50);
}

function closeOverlay(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('hidden'); el.setAttribute('aria-hidden', 'true'); }
}

// ── LocalStorage Utils ─────────────────────────────────────
const Store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
    catch (_) { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} },
  remove(key)     { try { localStorage.removeItem(key); } catch (_) {} }
};

// ── Recently Played ────────────────────────────────────────
const RECENT_KEY = 'ihnc_recent';

function trackGame(gameId) {
  const list = Store.get(RECENT_KEY, []).filter(r => r.id !== gameId);
  list.unshift({ id: gameId, ts: Date.now() });
  Store.set(RECENT_KEY, list.slice(0, 5));
  // Fire achievement stats if module is loaded
  if (typeof recordStat === 'function') {
    recordStat('gamesPlayed', 1);
    recordStat('uniqueGames', gameId);
  }
}

function getRecentGames() {
  return Store.get(RECENT_KEY, []);
}

// ── Player Names ───────────────────────────────────────────
function getSavedNames() { return Store.get('ihnc_names', []); }
function saveNames(names) { Store.set('ihnc_names', names.filter(Boolean).slice(0, 8)); }

// ── Per-game Settings ──────────────────────────────────────
function getSettings(gameId, defaults) {
  return Object.assign({}, defaults, Store.get('ihnc_cfg_' + gameId, {}));
}
function saveSettings(gameId, settings) {
  Store.set('ihnc_cfg_' + gameId, settings);
}

// ── Share Result ───────────────────────────────────────────
async function shareResult(text, url) {
  const href = url || location.href;
  if (navigator.share) {
    try {
      await navigator.share({ title: 'ihavenocards', text, url: href });
      if (typeof recordStat === 'function') recordStat('shared', true);
      return 'shared';
    }
    catch (_) {}
  }
  try {
    await navigator.clipboard.writeText(text + '\n' + href);
    showToast('Copied to clipboard!');
    if (typeof recordStat === 'function') recordStat('shared', true);
    return 'copied';
  } catch (_) { return false; }
}

function showToast(msg) {
  let toast = document.getElementById('shareToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'shareToast';
    toast.className = 'share-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── Game Night Session ─────────────────────────────────────
const SESSION_KEY = 'ihnc_session';

function getActiveSession() {
  const s = Store.get(SESSION_KEY, null);
  return (s && s.active) ? s : null;
}

function sessionIsActive() { return !!getActiveSession(); }

function logSessionResult(gameId, winnerName, allPlayerNames) {
  const session = getActiveSession();
  if (!session) return;
  const gameData = (typeof getById === 'function') ? getById(gameId) : null;
  session.results.push({
    gameId,
    gameName: gameData ? gameData.name : gameId,
    winner: winnerName,
    allPlayers: allPlayerNames || [],
    timestamp: Date.now(),
  });
  Store.set(SESSION_KEY, session);
  refreshSessionPill();
  showToast(`${winnerName}'s win added to Game Night! 🏆`);
}

// Replaces openOverlay for winner screens — injects "Add to Game Night" button when session active
function openWinnerOverlay(overlayId, gameId, winnerName, allPlayerNames) {
  openOverlay(overlayId);
  if (!sessionIsActive()) return;

  const content = document.querySelector('#' + overlayId + ' .overlay-content');
  if (!content || content.querySelector('.session-add-btn')) return;

  const btn = document.createElement('button');
  btn.className = 'btn btn-sm session-add-btn';
  btn.textContent = '➕ Add to Game Night';
  btn.onclick = () => {
    logSessionResult(gameId, winnerName, allPlayerNames);
    btn.textContent = '✅ Added to Game Night!';
    btn.disabled = true;
    btn.style.opacity = '0.6';
  };
  content.appendChild(btn);
}

// Floating session pill — injected on any page when a session is active
function initSessionPill() {
  // Don't show pill on the game-night page itself
  if (location.pathname.includes('game-night')) return;
  if (!sessionIsActive()) return;
  if (document.getElementById('sessionPill')) return;

  const pill = document.createElement('a');
  pill.id = 'sessionPill';
  pill.href = '/pages/game-night/';
  pill.setAttribute('aria-label', 'View Game Night');
  document.body.appendChild(pill);
  refreshSessionPill(pill);
}

function refreshSessionPill(pill) {
  const el = pill || document.getElementById('sessionPill');
  if (!el) return;
  const session = getActiveSession();
  if (!session) { el.remove(); return; }

  const tally = {};
  session.results.forEach(r => { tally[r.winner] = (tally[r.winner] || 0) + 1; });
  const entries = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const count = session.results.length;

  el.textContent = count === 0
    ? '🏆 Game Night'
    : `🏆 ${entries[0][0]} leads · ${count} game${count !== 1 ? 's' : ''}`;
}

// ── PWA Install Prompt ─────────────────────────────────────
let _deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredInstall = e;
  const btn = document.getElementById('installBtn');
  if (btn) btn.classList.remove('hidden');
});

function triggerInstall() {
  if (!_deferredInstall) return;
  _deferredInstall.prompt();
  _deferredInstall.userChoice.then(() => { _deferredInstall = null; });
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  SoundManager.init();

  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  const installBtn = document.getElementById('installBtn');
  if (installBtn) installBtn.addEventListener('click', triggerInstall);

  initSessionPill();
});

// ── Service Worker Registration ────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}
