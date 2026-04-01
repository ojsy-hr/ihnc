/* Spin the Wheel */

const WHEEL_KEY = 'ihnc_wheel_entries';
const MAX_ENTRIES = 12;

// Alternating segment colours (uses CSS var fallbacks for canvas which can't read CSS vars)
const SEG_COLORS_DARK  = ['#1e3a5f','#1a4a2e','#3a1a4a','#4a2e1a','#1a3a4a','#4a1a2e','#2e4a1a','#1a2e4a'];
const SEG_COLORS_LIGHT = ['#cce8ff','#ccf0e0','#e8ccff','#ffeacc','#ccf4ff','#ffd6e8','#e0ffcc','#ccdfff'];

let entries = [];
let isSpinning = false;
let currentAngle = 0;

function getSegColors() {
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  return dark ? SEG_COLORS_DARK : SEG_COLORS_LIGHT;
}

function getTextColor() {
  return document.documentElement.getAttribute('data-theme') !== 'light' ? '#eee' : '#111';
}

function getAccentColor() {
  return document.documentElement.getAttribute('data-theme') !== 'light' ? '#61dafb' : '#0077aa';
}

// ── Canvas drawing ─────────────────────────────────────────

function drawWheel(angle) {
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const r = Math.min(cx, cy) - 4;

  ctx.clearRect(0, 0, W, H);

  if (entries.length < 2) {
    // Draw placeholder
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = document.documentElement.getAttribute('data-theme') !== 'light' ? '#1f1f1f' : '#f2f2f2';
    ctx.fill();
    ctx.strokeStyle = document.documentElement.getAttribute('data-theme') !== 'light' ? '#333' : '#ccc';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = document.documentElement.getAttribute('data-theme') !== 'light' ? '#555' : '#aaa';
    ctx.font = 'bold 14px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add players below', cx, cy);
    return;
  }

  const n = entries.length;
  const slice = (2 * Math.PI) / n;
  const colors = getSegColors();
  const textCol = getTextColor();
  const accentCol = getAccentColor();

  for (let i = 0; i < n; i++) {
    const start = angle + i * slice;
    const end   = start + slice;

    // Segment fill
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = document.documentElement.getAttribute('data-theme') !== 'light' ? '#121212' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const maxLen = 11;
    const label = entries[i].length > maxLen ? entries[i].slice(0, maxLen - 1) + '…' : entries[i];
    const fontSize = n <= 6 ? 14 : n <= 9 ? 12 : 10;
    ctx.font = `bold ${fontSize}px Segoe UI, sans-serif`;
    ctx.fillStyle = textCol;
    ctx.fillText(label, r - 10, 0);
    ctx.restore();
  }

  // Centre cap
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
  ctx.fillStyle = accentCol;
  ctx.fill();
  ctx.strokeStyle = document.documentElement.getAttribute('data-theme') !== 'light' ? '#121212' : '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ── Spin physics ───────────────────────────────────────────

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function spinWheel() {
  if (isSpinning) return;
  if (entries.length < 2) {
    document.getElementById('wheelWarning').classList.remove('hidden');
    return;
  }
  document.getElementById('wheelWarning').classList.add('hidden');

  isSpinning = true;
  document.getElementById('spinBtn').disabled = true;

  const extraSpins  = (Math.floor(Math.random() * 6) + 5) * 2 * Math.PI; // 5–10 full rotations
  const targetAngle = currentAngle + extraSpins;
  const duration    = 3500; // ms
  const startAngle  = currentAngle;
  const startTime   = performance.now();

  function frame(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(t);
    currentAngle = startAngle + (targetAngle - startAngle) * eased;
    drawWheel(currentAngle);

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      currentAngle = targetAngle % (2 * Math.PI);
      isSpinning = false;
      document.getElementById('spinBtn').disabled = false;
      showWinner();
    }
  }

  requestAnimationFrame(frame);
}

function showWinner() {
  const n = entries.length;
  const slice = (2 * Math.PI) / n;
  // Pointer is at top (270° = -π/2 from 0). Find which segment it lands on.
  // currentAngle is the wheel rotation. Pointer at top = angle -π/2 from start.
  const pointerAngle = (2 * Math.PI - (currentAngle % (2 * Math.PI) + Math.PI / 2) + 2 * Math.PI) % (2 * Math.PI);
  const idx = Math.floor(pointerAngle / slice) % n;
  const winner = entries[idx];

  document.getElementById('spinResultName').textContent = winner;
  openOverlay('spinResultOverlay');

  if (typeof recordStat === 'function') recordStat('gamesPlayed', 1);
}

// ── Entry management ───────────────────────────────────────

function renderEntries() {
  const list = document.getElementById('entryList');
  list.innerHTML = entries.map((name, i) => `
    <div class="wheel-entry-row">
      <input type="text" value="${escHtml(name)}" maxlength="20"
        oninput="updateEntry(${i}, this.value)"
        aria-label="Player ${i + 1}" />
      <button class="wheel-remove-btn" onclick="removeEntry(${i})" aria-label="Remove player ${i + 1}">×</button>
    </div>
  `).join('');

  const addBtn = document.getElementById('addEntryBtn');
  addBtn.disabled = entries.length >= MAX_ENTRIES;
  addBtn.textContent = entries.length >= MAX_ENTRIES ? `Max ${MAX_ENTRIES} players` : '+ Add Player';

  drawWheel(currentAngle);
  persist();
}

function updateEntry(index, value) {
  entries[index] = value;
  drawWheel(currentAngle);
  persist();
}

function removeEntry(index) {
  entries.splice(index, 1);
  renderEntries();
}

function addEntry(name = '') {
  if (entries.length >= MAX_ENTRIES) return;
  entries.push(name);
  renderEntries();
  // Focus the new input
  const inputs = document.querySelectorAll('.wheel-entry-row input');
  if (inputs.length) inputs[inputs.length - 1].focus();
}

function persist() {
  Store.set(WHEEL_KEY, entries);
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Responsive canvas size ─────────────────────────────────

function resizeCanvas() {
  const canvas = document.getElementById('wheelCanvas');
  const size = Math.min(window.innerWidth - 48, 320);
  canvas.width  = size;
  canvas.height = size;
  drawWheel(currentAngle);
}

// ── Init ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();
  trackGame('spin-the-wheel');

  // Load saved entries or pre-fill from saved names
  const saved = Store.get(WHEEL_KEY, null);
  if (saved && Array.isArray(saved) && saved.length >= 2) {
    entries = saved;
  } else {
    const names = getSavedNames();
    entries = names.length >= 2 ? names.slice(0, 6) : ['Player 1', 'Player 2', 'Player 3'];
  }

  resizeCanvas();
  renderEntries();

  document.getElementById('addEntryBtn').addEventListener('click', () => addEntry());

  // Click canvas also spins
  document.getElementById('wheelCanvas').addEventListener('click', spinWheel);

  window.addEventListener('resize', resizeCanvas);

  // Redraw on theme change
  const observer = new MutationObserver(() => drawWheel(currentAngle));
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
});
