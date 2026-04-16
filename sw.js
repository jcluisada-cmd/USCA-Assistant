const CACHE_NAME = 'usca-v3.40';

// Fichiers locaux — pré-cachés à l'installation
const LOCAL_ASSETS = [
  './',
  './index.html',
  './staff/',
  './staff/index.html',
  './staff/toolbox.html',
  './patient/',
  './patient/index.html',
  './admin/',
  './admin/index.html',
  './shared/supabase.js',
  './shared/auth.js',
  './shared/fiches-catalogue.js',
  './shared/theme.css',
  './shared/theme.js',
  './shared/craving-agenda.js',
  './shared/planning-groupes.js',
  './icon-512.png',
  './splash.png',
  './manifest.json'
];

// Domaines à ne jamais cacher (API, temps réel)
const NETWORK_ONLY = [
  'supabase.co',
  '/api/slack',
  '/api/delete-user'
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
  const url = e.request.url;

  // Requêtes API/Realtime → toujours réseau, jamais de cache
  if (NETWORK_ONLY.some(domain => url.includes(domain))) {
    e.respondWith(fetch(e.request));
    return;
  }

  // NAVIGATION (pages HTML) → Network first, cache fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return resp;
        })
        .catch(() =>
          caches.match(e.request)
            .then(r => r || caches.match('./index.html'))
            .then(r => r || caches.match('./'))
        )
    );
    return;
  }

  // AUTRES REQUÊTES (scripts, CSS, fonts, CDN) → Cache first, network fallback
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
