const CACHE_NAME = 'usca-v1.5';

// Fichiers locaux — pré-cachés à l'installation (fiable)
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// CDN externes — cachés au fil de l'eau (pas dans addAll pour éviter échec global)
const CDN_ASSETS = [
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async c => {
      // Fichiers locaux : obligatoires
      await c.addAll(LOCAL_ASSETS);
      // CDN : best-effort (on ne bloque pas l'install si un CDN est down)
      for (const url of CDN_ASSETS) {
        try { const r = await fetch(url); if (r.ok) await c.put(url, r); }
        catch(e) { /* CDN indisponible — sera caché au prochain fetch */ }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      if (resp.ok && e.request.method === 'GET') {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
