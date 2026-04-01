/* ihavenocards — Service Worker (cache-first) */

const CACHE = 'ihnc-v4';

const PRECACHE = [
  '/',
  '/index.html',
  '/css/shared.css',
  '/css/index.css',
  '/js/shared.js',
  '/js/index.js',
  '/js/games-data.js',
  '/manifest.json',
  '/assets/icons/icon.svg',
  '/games/',
  '/games/index.html',
  '/pages/about/',
  '/pages/about/index.html',
  '/pages/cards/',
  '/pages/cards/index.html',
  '/pages/cards/higher-lower/',
  '/pages/cards/higher-lower/index.html',
  '/pages/cards/blackjack/',
  '/pages/cards/blackjack/index.html',
  '/pages/cards/pontoon/',
  '/pages/cards/pontoon/index.html',
  '/pages/cards/ring-of-fire/',
  '/pages/cards/ring-of-fire/index.html',
  '/pages/cards/snap/',
  '/pages/cards/snap/index.html',
  '/pages/cards/ride-the-bus/',
  '/pages/cards/ride-the-bus/index.html',
  '/pages/darts/',
  '/pages/darts/index.html',
  '/pages/darts/blind-killer/',
  '/pages/darts/blind-killer/index.html',
  '/pages/darts/cricket/',
  '/pages/darts/cricket/index.html',
  '/pages/darts/killer/',
  '/pages/darts/killer/index.html',
  '/pages/darts/shanghai/',
  '/pages/darts/shanghai/index.html',
  '/pages/pool/',
  '/pages/pool/index.html',
  '/pages/pool/cutthroat/',
  '/pages/pool/cutthroat/index.html',
  '/css/about.css',
  '/css/feedback.css',
  '/css/hub.css',
  '/css/games.css',
  '/css/card-game.css',
  '/css/darts-game.css',
  '/css/cutthroat.css',
  '/css/blind_killer.css',
  '/css/cricket.css',
  '/js/higher_lower.js',
  '/js/blackjack.js',
  '/js/pontoon.js',
  '/js/ring_of_fire.js',
  '/js/snap.js',
  '/js/ride_the_bus.js',
  '/js/shanghai.js',
  '/js/killer.js',
  '/js/cutthroat.js',
  '/js/analytics.js',
  // Phase 1 — Party games
  '/pages/party/',
  '/pages/party/index.html',
  '/pages/party/never-have-i-ever/',
  '/pages/party/never-have-i-ever/index.html',
  '/pages/party/truth-or-dare/',
  '/pages/party/truth-or-dare/index.html',
  '/pages/party/drink-tracker/',
  '/pages/party/drink-tracker/index.html',
  '/js/never_have_i_ever.js',
  '/js/truth_or_dare.js',
  '/js/drink_tracker.js',
  // Phase 2 — Achievements
  '/pages/achievements/',
  '/pages/achievements/index.html',
  '/js/achievements.js',
  '/css/achievements.css',
  // Phase 3 — Spin the Wheel + Picker
  '/pages/party/spin-the-wheel/',
  '/pages/party/spin-the-wheel/index.html',
  '/pages/picker/',
  '/pages/picker/index.html',
  '/js/spin_the_wheel.js',
  '/js/picker.js',
  '/css/picker.css',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Only handle GET requests for same-origin or CDN assets
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(response => {
        // Cache successful same-origin responses
        if (response.ok && (e.request.url.startsWith(self.location.origin) || e.request.url.includes('fonts.'))) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
