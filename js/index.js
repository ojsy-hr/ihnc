/* Home page — categories, random game, recently played */

const CATEGORIES = [
  { slug: 'cards',  emoji: '🃏', name: 'Card Games',  tagline: 'Classic card games for 1 or more players.' },
  { slug: 'darts',  emoji: '🎯', name: 'Darts',       tagline: 'Score with friends at the oche.' },
  { slug: 'pool',   emoji: '🎱', name: 'Pool',        tagline: 'Keep score around the table.' },
  { slug: 'party',  emoji: '🔥', name: 'Party',       tagline: 'Drinking games for a crowd.' },
];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  renderCategories();
  renderRecent();

  // Random game
  document.getElementById('randomGameBtn').addEventListener('click', () => {
    const game = GAMES[Math.floor(Math.random() * GAMES.length)];
    window.location.href = game.url;
  });
});

function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  grid.innerHTML = CATEGORIES.map(cat => {
    const count = getByCategory(cat.slug).length;
    const label = count === 1 ? 'game' : 'games';
    return `
      <a href="/games/?category=${cat.slug}" class="category-tile">
        <div class="category-tile-emoji">${cat.emoji}</div>
        <div class="category-tile-name">${cat.name}</div>
        <div class="category-tile-count">${count} ${label}</div>
        <div class="category-tile-tagline">${cat.tagline}</div>
      </a>`.trim();
  }).join('');
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
