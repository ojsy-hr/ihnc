/* Drink Tracker */

const DT_KEY = 'ihnc_drink_tracker';

let dtPlayers = [];
let editingIndex = -1;
let longPressTimer = null;

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

function startTracking() {
  const count = parseInt(document.getElementById('numPlayers').value);
  const inputs = document.querySelectorAll('#playerNameInputs input');
  const names = Array.from(inputs).map((inp, i) => inp.value.trim() || `Player ${i + 1}`);
  saveNames(names);

  // Try to restore saved state if player list matches
  const saved = Store.get(DT_KEY, null);
  if (saved && saved.players && saved.players.length === names.length) {
    dtPlayers = saved.players.map((p, i) => ({ name: names[i], count: p.count }));
  } else {
    dtPlayers = names.map(n => ({ name: n, count: 0 }));
  }

  document.getElementById('setupSection').classList.add('hidden');
  const tracker = document.getElementById('trackerSection');
  tracker.style.display = 'flex';
  tracker.classList.remove('hidden');

  renderGrid();
  trackGame('drink-tracker');
  if (typeof recordStat === 'function') recordStat('gamesPlayed', 1);
  if (typeof recordStat === 'function') recordStat('uniqueGames', 'drink-tracker');
}

function renderGrid() {
  const grid = document.getElementById('playerGrid');
  grid.innerHTML = dtPlayers.map((p, i) => `
    <div class="dt-player-card" data-color="${i % 8}" data-index="${i}">
      <div class="dt-player-name" data-index="${i}">${escHtml(p.name)}</div>
      <div class="dt-count" id="count-${i}">${p.count}</div>
      <div class="dt-tally" id="tally-${i}">${renderTally(p.count)}</div>
      <div class="dt-buttons">
        <button class="dt-btn dt-btn-minus" onclick="adjust(${i}, -1)" aria-label="Minus">−</button>
        <button class="dt-btn dt-btn-plus"  onclick="adjust(${i},  1)" aria-label="Plus">+</button>
      </div>
    </div>
  `).join('');

  // Long-press to edit name
  grid.querySelectorAll('.dt-player-name').forEach(el => {
    el.addEventListener('pointerdown', () => {
      const idx = parseInt(el.dataset.index);
      longPressTimer = setTimeout(() => openNameEdit(idx), 500);
    });
    el.addEventListener('pointerup',   () => clearTimeout(longPressTimer));
    el.addEventListener('pointerleave',() => clearTimeout(longPressTimer));
  });
}

function renderTally(count) {
  if (count === 0) return '';
  const groups = Math.floor(count / 5);
  const rem    = count % 5;
  let html = '';
  for (let g = 0; g < groups; g++) {
    // 4 dots + gate mark
    html += '<span class="dt-dot"></span>'.repeat(4);
    html += '<span class="dt-dot gate-mark"></span>';
  }
  html += '<span class="dt-dot"></span>'.repeat(rem);
  return html;
}

function adjust(index, delta) {
  dtPlayers[index].count = Math.max(0, dtPlayers[index].count + delta);
  document.getElementById(`count-${index}`).textContent = dtPlayers[index].count;
  document.getElementById(`tally-${index}`).innerHTML = renderTally(dtPlayers[index].count);
  persist();
  if (navigator.vibrate) navigator.vibrate(30);
}

function persist() {
  Store.set(DT_KEY, { players: dtPlayers });
}

function confirmReset() {
  openOverlay('confirmOverlay');
}

function doReset() {
  dtPlayers.forEach(p => p.count = 0);
  renderGrid();
  persist();
  closeOverlay('confirmOverlay');
}

function backToSetup() {
  document.getElementById('trackerSection').style.display = 'none';
  document.getElementById('trackerSection').classList.add('hidden');
  document.getElementById('setupSection').classList.remove('hidden');
}

function openNameEdit(index) {
  editingIndex = index;
  const input = document.getElementById('nameEditInput');
  input.value = dtPlayers[index].name;
  openOverlay('nameEditOverlay');
  setTimeout(() => input.focus(), 80);
}

function saveNameEdit() {
  if (editingIndex < 0) return;
  const val = document.getElementById('nameEditInput').value.trim();
  if (val) dtPlayers[editingIndex].name = val;
  closeOverlay('nameEditOverlay');
  renderGrid();
  persist();
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  const slider = document.getElementById('numPlayers');
  slider.addEventListener('input', () => updatePlayerInputs(slider.value));
  updatePlayerInputs(slider.value);

  document.getElementById('startBtn').addEventListener('click', startTracking);

  document.getElementById('nameEditInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveNameEdit();
  });
});
