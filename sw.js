const CACHE_NAME = 'usca-v3.99';

// ── Configuration Push (partagé avec patient/index.html) ──
const SUPABASE_URL_BASE = 'https://pydxfoqxgvbmknzjzecn.supabase.co';
const SUPABASE_ANON_KEY_SW = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5ZHhmb3F4Z3ZibWtuemp6ZWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTgyNTEsImV4cCI6MjA5MTY5NDI1MX0.8Q8-wJUiOLHdf3vtMAvXMQ4JaylTGE-lm5viPWeVfZU';

// Fichiers locaux — pré-cachés à l'installation
const LOCAL_ASSETS = [
  './',
  './index.html',
  './staff/toolbox.html',
  './patient/',
  './patient/index.html',
  './admin/',
  './admin/index.html',
  './etudiant/',
  './etudiant/index.html',
  './extern/',
  './extern/index.html',
  './shared/livret-ifsi-contenu.js',
  './shared/qcm-engine.js',
  './data/index.json',
  './postcure/patient.html',
  './postcure/medecin.html',
  './shared/supabase.js',
  './shared/auth.js',
  './shared/fiches-catalogue.js',
  './shared/theme.css',
  './shared/theme.js',
  './shared/craving-agenda.js',
  './shared/planning-groupes.js',
  './shared/postcure-structures.js',
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

  // Ignorer les schémas non-http (chrome-extension://, etc.) : non cachables
  if (!url.startsWith('http')) return;

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

// ══════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS (pattern "empty push + fetch last message")
// Le push arrive sans data ; on fetch le dernier message du patient
// depuis Supabase via son patient_id stocké en IndexedDB/localStorage.
// ══════════════════════════════════════════════════════════

async function getPatientIdFromIdb() {
  try {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      // On demande au client d'envoyer son patient_id (localStorage only main thread)
      const chan = new MessageChannel();
      const reply = new Promise(resolve => {
        chan.port1.onmessage = (ev) => resolve(ev.data && ev.data.patient_id);
        setTimeout(() => resolve(null), 500);
      });
      client.postMessage({ type: 'get-patient-id' }, [chan.port2]);
      const pid = await reply;
      if (pid) return pid;
    }
  } catch (e) {}
  // Fallback : IndexedDB géré par le client via 'push-patient-id'
  try {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('usca-push', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const tx = db.transaction('kv', 'readonly');
    const store = tx.objectStore('kv');
    const pid = await new Promise(res => {
      const g = store.get('patient_id');
      g.onsuccess = () => res(g.result);
      g.onerror = () => res(null);
    });
    db.close();
    return pid || null;
  } catch (e) {
    return null;
  }
}

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    const patientId = await getPatientIdFromIdb();
    let title = 'USCA Connect';
    let options = {
      body: 'Nouvelle notification',
      icon: '/icon-512.png',
      badge: '/icon-512.png',
      tag: 'default',
      data: { url: '/patient/' }
    };

    // Si payload inclus, on le parse ; sinon on fetch
    try {
      if (event.data) {
        const payload = event.data.json();
        if (payload.title) title = payload.title;
        if (payload.body) options.body = payload.body;
        if (payload.url) options.data.url = payload.url;
        if (payload.tag) options.tag = payload.tag;
      } else if (patientId) {
        const resp = await fetch(
          SUPABASE_URL_BASE + '/rest/v1/push_last_message?patient_id=eq.' + patientId + '&select=*',
          { headers: { 'apikey': SUPABASE_ANON_KEY_SW, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY_SW } }
        );
        if (resp.ok) {
          const rows = await resp.json();
          if (rows && rows[0]) {
            title = rows[0].title || title;
            options.body = rows[0].body || options.body;
            options.data.url = rows[0].url || options.data.url;
            options.tag = rows[0].tag || options.tag;
          }
        }
      }
    } catch (e) { /* silent */ }

    await self.registration.showNotification(title, options);
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/patient/';
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Si une fenêtre patient existe, la focus
    for (const client of clients) {
      if (client.url.includes('/patient') && 'focus' in client) {
        client.postMessage({ type: 'push-clicked', url });
        return client.focus();
      }
    }
    // Sinon ouvrir
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});

// Réception du patient_id depuis le client principal (pour IndexedDB)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'set-patient-id' && event.data.patient_id) {
    (async () => {
      try {
        const db = await new Promise((res, rej) => {
          const r = indexedDB.open('usca-push', 1);
          r.onupgradeneeded = () => r.result.createObjectStore('kv');
          r.onsuccess = () => res(r.result);
          r.onerror = () => rej(r.error);
        });
        const tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').put(event.data.patient_id, 'patient_id');
        db.close();
      } catch (e) {}
    })();
  }
});
