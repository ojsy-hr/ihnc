/* ==========================================================
   ihavenocards — Game Night
   ========================================================== */

// SESSION_KEY and Store/getActiveSession/sessionIsActive/logSessionResult
// are all defined in shared.js which loads before this file.

let durationTimer = null;

// ── Setup ─────────────────────────────────────────────────
function updateSetup() {
  const n = parseInt(document.getElementById('playerCount').value, 10);
  document.getElementById('playerCountDisplay').textContent = n;
  const container = document.getElementById('nameInputs');
  const saved = getSavedNames();
  const current = Array.from(container.querySelectorAll('input')).map(i => i.value);
  container.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'player-name-input';
    inp.maxLength = 25;
    inp.placeholder = `Player ${i + 1}`;
    inp.value = current[i] !== undefined ? current[i] : (saved[i] || '');
    container.appendChild(inp);
  }
}

function startNight() {
  const nameVal = document.getElementById('nightNameInput').value.trim() || 'Game Night';
  const inputs  = document.querySelectorAll('#nameInputs input');
  const names   = Array.from(inputs).map((inp, i) => inp.value.trim() || `Player ${i + 1}`);
  saveNames(names.filter(Boolean));

  const session = {
    id:        crypto.randomUUID(),
    name:      nameVal,
    startedAt: Date.now(),
    players:   names,
    results:   [],
    active:    true,
  };
  Store.set(SESSION_KEY, session);

  showActiveSection();
}

// ── Showing sections ──────────────────────────────────────
function showActiveSection() {
  document.getElementById('setupSection').classList.add('hidden');
  document.getElementById('activeSection').classList.remove('hidden');
  renderActive();
  startDurationTimer();
}

function showSetupSection() {
  document.getElementById('activeSection').classList.add('hidden');
  document.getElementById('setupSection').classList.remove('hidden');
  stopDurationTimer();
  updateSetup();
}

// ── Render ────────────────────────────────────────────────
function renderActive() {
  const session = getActiveSession();
  if (!session) return;

  document.getElementById('nightNameDisplay').textContent = session.name;
  updateDurationDisplay();
  renderLeaderboard(session);
  renderTimeline(session);
  populateManualSelects(session);
}

function renderLeaderboard(session) {
  const tally = {};
  session.players.forEach(p => { tally[p] = 0; });
  session.results.forEach(r => {
    if (tally[r.winner] !== undefined) tally[r.winner]++;
    else tally[r.winner] = 1; // player not in registered list but won a game
  });

  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const maxWins = sorted[0]?.[1] || 1;

  const rankEmojis = ['🥇', '🥈', '🥉'];
  let html = '';
  sorted.forEach(([name, wins], idx) => {
    const isLeader = idx === 0 && wins > 0;
    const barPct = maxWins > 0 ? Math.round((wins / maxWins) * 100) : 0;
    const rank = rankEmojis[idx] || `${idx + 1}.`;
    html += `
      <div class="gn-player-row${isLeader ? ' leader' : ''}">
        <span class="gn-rank">${rank}</span>
        <span class="gn-player-name">${escHtml(name)}</span>
        <div class="gn-wins-bar-wrap">
          <div class="gn-wins-bar" style="width:${barPct}%"></div>
        </div>
        <span class="gn-wins">${wins} win${wins !== 1 ? 's' : ''}</span>
      </div>`;
  });

  document.getElementById('leaderboard').innerHTML = html || '<p class="gn-empty-state">No results yet.</p>';
}

function renderTimeline(session) {
  const el = document.getElementById('timeline');
  if (session.results.length === 0) {
    el.innerHTML = '<p class="gn-empty-state">Go play a game and add the result here!</p>';
    return;
  }

  const items = [...session.results].reverse();
  el.innerHTML = items.map(r => {
    const gameData = (typeof getById === 'function') ? getById(r.gameId) : null;
    const icon = gameData ? gameData.emoji : '🎮';
    return `
      <div class="gn-timeline-item">
        <span class="gn-game-icon">${icon}</span>
        <span class="gn-timeline-result">
          <span class="gn-winner-name">${escHtml(r.winner)}</span>
          won ${escHtml(r.gameName)}
        </span>
        <span class="gn-time-ago">${timeAgo(r.timestamp)}</span>
      </div>`;
  }).join('');
}

function populateManualSelects(session) {
  // Game select — all multiplayer games
  const gameSelect = document.getElementById('manualGameSelect');
  if (gameSelect) {
    const multiGames = typeof GAMES !== 'undefined'
      ? GAMES.filter(g => g.players !== '1')
      : [];
    gameSelect.innerHTML = multiGames.map(g =>
      `<option value="${g.id}">${g.emoji} ${g.name}</option>`
    ).join('');
  }

  // Winner select — session players
  const winnerSelect = document.getElementById('manualWinnerSelect');
  if (winnerSelect) {
    winnerSelect.innerHTML = session.players.map(p =>
      `<option value="${escHtml(p)}">${escHtml(p)}</option>`
    ).join('');
  }
}

// ── Manual result entry ───────────────────────────────────
function submitManualResult() {
  const gameId   = document.getElementById('manualGameSelect').value;
  const winner   = document.getElementById('manualWinnerSelect').value;
  if (!gameId || !winner) return;
  logSessionResult(gameId, winner, []);
  closeOverlay('manualAddOverlay');
  renderActive();
}

// ── Duration timer ────────────────────────────────────────
function startDurationTimer() {
  stopDurationTimer();
  durationTimer = setInterval(updateDurationDisplay, 30000);
}

function stopDurationTimer() {
  if (durationTimer) { clearInterval(durationTimer); durationTimer = null; }
}

function updateDurationDisplay() {
  const session = getActiveSession();
  const el = document.getElementById('durationDisplay');
  if (!el || !session) return;
  el.textContent = formatDuration(Date.now() - session.startedAt);
}

function formatDuration(ms) {
  const totalMins = Math.floor(ms / 60000);
  if (totalMins < 1)  return 'Just started';
  if (totalMins < 60) return `${totalMins}m`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── End Night ─────────────────────────────────────────────
function endNight() {
  closeOverlay('endNightConfirmOverlay');
  const session = getActiveSession();
  if (!session) return;

  session.active = false;
  Store.set(SESSION_KEY, session);
  stopDurationTimer();
  showSummary(session);
}

function showSummary(session) {
  // Tally wins
  const tally = {};
  session.players.forEach(p => { tally[p] = 0; });
  session.results.forEach(r => {
    tally[r.winner] = (tally[r.winner] || 0) + 1;
  });
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const topWins = sorted[0]?.[1] || 0;
  const champions = sorted.filter(([, w]) => w === topWins && w > 0).map(([n]) => n);

  // Winner message
  const winnerMsg = document.getElementById('summaryWinnerMsg');
  if (champions.length === 0) {
    winnerMsg.textContent = 'No results recorded!';
  } else if (champions.length === 1) {
    winnerMsg.textContent = `🏆 ${champions[0]} wins the night!`;
  } else {
    winnerMsg.textContent = `🤝 Tied night! ${champions.join(' & ')}`;
  }

  // Meta
  const duration = formatDuration(Date.now() - session.startedAt);
  document.getElementById('summaryMeta').textContent =
    `${session.results.length} game${session.results.length !== 1 ? 's' : ''} played · ${duration}`;

  // Table
  const table = document.getElementById('summaryTable');
  table.innerHTML =
    '<tr><th>Player</th><th>Wins</th></tr>' +
    sorted.map(([name, wins]) =>
      `<tr><td>${escHtml(name)}</td><td>${wins}</td></tr>`
    ).join('');

  // Share button
  document.getElementById('summaryShareBtn').onclick = () => {
    const text = champions.length === 1
      ? `🏆 ${champions[0]} won tonight's Game Night on ihavenocards! ${session.results.length} games played.`
      : `🤝 ${champions.join(' & ')} tied tonight's Game Night on ihavenocards!`;
    shareResult(text, 'https://ihavenocards.com/pages/game-night/');
  };

  openOverlay('summaryOverlay');
}

// ── Start new night ───────────────────────────────────────
function startNewNight() {
  Store.remove(SESSION_KEY);
  closeOverlay('summaryOverlay');
  showSetupSection();
}

// ── Helpers ───────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function timeAgo(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  document.getElementById('playerCount').addEventListener('input', updateSetup);
  updateSetup();

  const session = getActiveSession();
  if (session) {
    showActiveSection();
  }
});
