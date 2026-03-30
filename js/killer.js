/* Killer Darts */

let players = [], currentPlayerIdx = 0;
let dartsThrown = 0, dartHits = [];

function updateSetup() {
  const n = parseInt(document.getElementById('playerCount').value);
  document.getElementById('playerCountDisplay').textContent = n;
  const container = document.getElementById('nameInputs');
  container.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:0.5rem;justify-content:center;margin-bottom:0.5rem;align-items:center;flex-wrap:wrap;';
    row.innerHTML = `
      <input type="text" placeholder="Player ${i+1} name" style="width:160px;padding:0.5rem 0.75rem;border-radius:var(--radius);border:2px solid var(--border);background:var(--surface-raised);color:var(--text);font-size:1rem;font-family:inherit;user-select:text;" />
      <input type="number" placeholder="Number (1-20)" min="1" max="20" style="width:130px;padding:0.5rem 0.75rem;border-radius:var(--radius);border:2px solid var(--border);background:var(--surface-raised);color:var(--text);font-size:1rem;font-family:inherit;user-select:text;" />`;
    container.appendChild(row);
  }
}

function startGame() {
  const rows = document.querySelectorAll('#nameInputs > div');
  const usedNumbers = new Set();
  players = [];

  for (let i = 0; i < rows.length; i++) {
    const [nameInp, numInp] = rows[i].querySelectorAll('input');
    const name = nameInp.value.trim() || `Player ${i+1}`;
    const num  = parseInt(numInp.value);

    if (isNaN(num) || num < 1 || num > 20) {
      alert(`${name}: please enter a number between 1 and 20.`);
      return;
    }
    if (usedNumbers.has(num)) {
      alert(`Number ${num} is already taken. Each player must have a unique number.`);
      return;
    }
    usedNumbers.add(num);
    players.push({ name, num, lives: 3, marks: 0, isKiller: false, eliminated: false });
  }

  currentPlayerIdx = 0;
  dartsThrown = 0;
  dartHits = [];

  document.getElementById('setupSection').classList.add('hidden');
  document.getElementById('gameSection').classList.remove('hidden');

  renderState();
}

function renderState() {
  const p = players[currentPlayerIdx];
  document.getElementById('currentTurnDisplay').textContent = p.name;
  document.getElementById('phaseDisplay').textContent = p.isKiller ? '⚔️ Killer' : 'Qualifying';

  // Scoreboard
  document.getElementById('scoreboard').innerHTML = players.map(pl => `
    <div class="darts-player-col ${pl === p ? 'active' : ''}${pl.eliminated ? ' eliminated' : ''}">
      <h3>${pl.name}${pl.isKiller ? ' ⚔️' : ''}</h3>
      <div class="darts-player-score">${pl.num}</div>
      <div class="killer-lives">${[0,1,2].map(i => `<div class="life-dot${i >= pl.lives ? ' lost' : ''}"></div>`).join('')}</div>
      <div class="darts-player-detail">${pl.eliminated ? '💀 Out' : pl.isKiller ? 'Killer' : `${pl.marks}/3 hits`}</div>
    </div>`).join('');

  // Instruction
  const instr = document.getElementById('throwInstruction');
  if (p.eliminated) {
    instr.textContent = `${p.name} is eliminated — skipping their turn.`;
    document.getElementById('throwControls').classList.add('hidden');
    setTimeout(() => endTurn(), 1000);
    return;
  }

  document.getElementById('throwControls').classList.remove('hidden');

  if (!p.isKiller) {
    instr.textContent = `${p.name} — hit number ${p.num} to qualify. (${p.marks}/3 marks, ${3 - dartsThrown} darts left)`;
  } else {
    instr.textContent = `${p.name} ⚔️ — hit an opponent's number to take their life! (${3 - dartsThrown} darts left)`;
  }

  // Darts row
  document.getElementById('dartsRow').innerHTML = [0,1,2].map(i => {
    if (i < dartHits.length) {
      const cls = dartHits[i] ? 'hit' : 'miss';
      return `<span class="dart-thrown ${cls}">${dartHits[i] ? 'Hit' : 'Miss'}</span>`;
    }
    return `<span class="dart-thrown pending">Dart ${i+1}</span>`;
  }).join('');

  document.getElementById('endTurnBtn').classList.toggle('hidden', dartsThrown < 3);
}

function recordHit() {
  if (dartsThrown >= 3) return;
  const p = players[currentPlayerIdx];
  dartHits.push(true);
  dartsThrown++;

  if (!p.isKiller) {
    p.marks++;
    if (p.marks >= 3) p.isKiller = true;
  } else {
    // Show a selector for who they hit
    promptTargetSelect();
    return;
  }

  checkEndTurn();
  renderState();
}

function promptTargetSelect() {
  const p = players[currentPlayerIdx];
  const targets = players.filter(pl => !pl.eliminated && pl !== p);
  if (targets.length === 0) { checkEndTurn(); renderState(); return; }

  // Build quick selector overlay (inline)
  const sel = document.createElement('div');
  sel.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:800;padding:1rem;';
  sel.innerHTML = `
    <div style="background:var(--surface);border-radius:var(--radius-lg);padding:2rem;max-width:320px;width:100%;text-align:center;border:1px solid var(--border)">
      <h3 style="color:var(--accent);margin-top:0">Who did you hit?</h3>
      <p style="color:var(--text-muted);font-size:0.9rem">Select the player whose number was hit.</p>
      <div style="display:flex;flex-direction:column;gap:0.5rem">
        ${targets.map(t => `<button class="btn btn-outline" onclick="applyKill(${players.indexOf(t)}, this.closest('.kill-sel'))">${t.name} (${t.num})</button>`).join('')}
      </div>
    </div>`;
  sel.className = 'kill-sel';
  document.body.appendChild(sel);

  // patch the buttons to close the overlay
  sel.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => sel.remove());
  });
}

function applyKill(targetIdx, overlayEl) {
  if (overlayEl) overlayEl.remove();
  const target = players[targetIdx];
  target.lives = Math.max(0, target.lives - 1);
  if (target.lives === 0) target.eliminated = true;

  // Check win
  const alive = players.filter(pl => !pl.eliminated);
  if (alive.length === 1) {
    document.getElementById('winnerMsg').textContent = `🏆 ${alive[0].name} wins!`;
    setTimeout(() => openOverlay('winnerOverlay'), 400);
    return;
  }

  checkEndTurn();
  renderState();
}

function recordMiss() {
  if (dartsThrown >= 3) return;
  dartHits.push(false);
  dartsThrown++;
  checkEndTurn();
  renderState();
}

function checkEndTurn() {
  if (dartsThrown >= 3) {
    document.getElementById('endTurnBtn').classList.remove('hidden');
  }
}

function endTurn() {
  dartsThrown = 0;
  dartHits = [];
  document.getElementById('endTurnBtn').classList.add('hidden');

  // Advance to next non-eliminated player
  let next = (currentPlayerIdx + 1) % players.length;
  let loops = 0;
  while (players[next].eliminated && loops < players.length) {
    next = (next + 1) % players.length;
    loops++;
  }
  currentPlayerIdx = next;
  renderState();
}

function confirmReset() {
  if (confirm('Reset the game?')) location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();
  trackGame('killer');
  updateSetup();

  document.getElementById('howToPlayBtn').addEventListener('click', () => openOverlay('rulesOverlay'));
  document.getElementById('closeRulesBtn').addEventListener('click', () => closeOverlay('rulesOverlay'));
});
