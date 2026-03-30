/* Home page — game grid, filters, random game, recently played */

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  renderGrid('all');
  renderRecent();

  // Category filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid(btn.dataset.category);
    });
  });

  // Random game
  document.getElementById('randomGameBtn').addEventListener('click', () => {
    const game = GAMES[Math.floor(Math.random() * GAMES.length)];
    window.location.href = game.url;
  });
});

function renderGrid(category) {
  const grid = document.getElementById('gameGrid');
  const games = getByCategory(category);
  grid.innerHTML = games.map(g => buildGameCard(g)).join('');
}

function renderRecent() {
  const recent = getRecentGames();
  const section = document.getElementById('recentSection');
  const grid    = document.getElementById('recentGrid');
  if (!recent.length) return;

  const cards = recent
    .map(r => getById(r.id))
    .filter(Boolean)
    .slice(0, 3)
    .map(g => buildGameCard(g))
    .join('');

  grid.innerHTML = cards;
  section.classList.remove('hidden');
}
