const CACHE_NAME = 'usca-v2.0';

// Fichiers locaux uniquement — pré-cachés à l'installation
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// ── INSTALL : cache les fichiers locaux ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(LOCAL_ASSETS))
  );
  self.skipWaiting();
});

// ── ACTIVATE : supprime les anciens caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH : stratégie différente selon le type de requête ──
self.addEventListener('fetch', e => {

  // NAVIGATION (lancement PWA, clic sur lien) → Network first, cache fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          // Mettre à jour le cache avec la version réseau
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return resp;
        })
        .catch(() =>
          // Hors-ligne : servir depuis le cache
          caches.match(e.request)
            .then(r => r || caches.match('./index.html'))
            .then(r => r || caches.match('./'))
        )
    );
    return;
  }

  // AUTRES REQUÊTES (scripts, CSS, fonts) → Cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(r => {
      if (r) return r;
      return fetch(e.request).then(resp => {
        if (resp.ok && e.request.method === 'GET') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});
