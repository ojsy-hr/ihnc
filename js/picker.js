/* What Should We Play? — Game Picker */

const TOTAL_STEPS = 5;
let currentStep = 1;
const answers = {};

// ── Scoring weights ────────────────────────────────────────

function scoreGame(game, ans) {
  let score = 0;
  const tags = game.tags || [];
  const players = game.players || '';

  // Players
  if (ans.players === '1') {
    if (players === '1' || players.startsWith('1')) score += 3;
    else score -= 2;
  } else if (ans.players === '2') {
    if (players === '2' || players.includes('2') || players.endsWith('+')) score += 2;
  } else if (ans.players === '3-4') {
    if (players.includes('3') || players.includes('4') || players.endsWith('+')) score += 3;
    if (players === '1') score -= 1;
  } else if (ans.players === '5+') {
    if (players.endsWith('+') && !players.startsWith('1')) score += 3;
    if (players === '1' || players === '2') score -= 2;
  }

  // Vibe
  if (ans.vibe === 'casual') {
    if (tags.includes('casual') || tags.includes('social')) score += 2;
    if (tags.includes('competitive')) score -= 1;
  } else if (ans.vibe === 'competitive') {
    if (tags.includes('competitive')) score += 3;
    if (tags.includes('casual') || tags.includes('social')) score -= 1;
  } else if (ans.vibe === 'party') {
    if (game.category === 'party' || tags.includes('party')) score += 3;
    if (game.category !== 'party') score -= 1;
  }

  // Drinking
  if (ans.drinking === 'yes') {
    if (tags.includes('drinking')) score += 3;
    else score -= 1;
  } else if (ans.drinking === 'no') {
    if (tags.includes('drinking')) score -= 3;
    else score += 1;
  }
  // 'any' — no modifier

  // Length
  if (ans.length === 'quick') {
    if (tags.includes('quick')) score += 2;
    if (tags.includes('long')) score -= 2;
  } else if (ans.length === 'medium') {
    if (tags.includes('medium')) score += 2;
  } else if (ans.length === 'long') {
    if (tags.includes('long')) score += 2;
    if (tags.includes('quick') && !tags.includes('medium')) score -= 1;
  }

  // Category
  if (ans.category !== 'any') {
    if (game.category === ans.category) score += 4;
    else score -= 2;
  }

  return score;
}

function getRecommendations(ans) {
  return [...GAMES]
    .map(g => ({ game: g, score: scoreGame(g, ans) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(x => x.game);
}

// ── Step navigation ────────────────────────────────────────

function goToStep(step) {
  // Hide all steps
  document.querySelectorAll('.picker-step').forEach(el => el.classList.add('hidden'));

  if (step > TOTAL_STEPS) {
    showResults();
    return;
  }

  // Show target step
  const target = document.querySelector(`.picker-step[data-step="${step}"]`);
  if (target) {
    target.classList.remove('hidden');
    target.style.animation = 'slideUp 0.25s ease';
  }

  currentStep = step;

  // Progress bar
  const pct = Math.round(((step - 1) / TOTAL_STEPS) * 100);
  document.getElementById('pickerProgressBar').style.width = pct + '%';
  document.getElementById('pickerProgressLabel').textContent = `Question ${step} of ${TOTAL_STEPS}`;

  // Back button
  const backBtn = document.getElementById('pickerBackBtn');
  if (step > 1) backBtn.classList.remove('hidden');
  else backBtn.classList.add('hidden');

  document.getElementById('pickerResults').classList.add('hidden');
}

function showResults() {
  document.querySelectorAll('.picker-step').forEach(el => el.classList.add('hidden'));
  document.getElementById('pickerBackBtn').classList.add('hidden');
  document.getElementById('pickerProgressBar').style.width = '100%';
  document.getElementById('pickerProgressLabel').textContent = 'Here\'s your match!';

  const recs = getRecommendations(answers);
  const grid = document.getElementById('pickerResultGrid');

  if (recs.length === 0) {
    grid.innerHTML = `<p style="color:var(--text-muted);text-align:center;grid-column:1/-1">
      No perfect match found — try <a href="/games/">browsing all games</a>!
    </p>`;
  } else {
    grid.innerHTML = recs.map(g => buildGameCard(g, '/')).join('');
  }

  document.getElementById('pickerResults').classList.remove('hidden');
  document.getElementById('pickerResults').style.animation = 'slideUp 0.3s ease';
}

function resetPicker() {
  Object.keys(answers).forEach(k => delete answers[k]);
  goToStep(1);
}

// ── Init ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  // Choice buttons
  document.querySelectorAll('.picker-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const val = btn.dataset.val;
      answers[key] = val;

      // Highlight selected
      const siblings = btn.closest('.picker-choices').querySelectorAll('.picker-choice');
      siblings.forEach(s => s.classList.remove('active'));
      btn.classList.add('active');

      // Advance after short delay for visual feedback
      setTimeout(() => goToStep(currentStep + 1), 220);
    });
  });

  // Back button
  document.getElementById('pickerBackBtn').addEventListener('click', () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  goToStep(1);
});
