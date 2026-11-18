// Wandelbuddy service worker
// - De app-bestanden worden altijd eerst vers van de server gehaald (zo zie je meteen de nieuwste versie);
//   zonder internet valt hij terug op de bewaarde kopie.
// - De Firebase-bibliotheek (vaste versie) wordt bewaard, zodat de app sneller opent.
// - Gegevens uit de database (Firestore) gaan nooit via deze cache.
const CACHE = 'wandelbuddy-v1';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'firebase-config.js', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // eigen app-bestanden: eerst het netwerk (vers), anders de bewaarde kopie
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
    );
    return;
  }

  // Firebase-bibliotheek met vaste versie: eerst de bewaarde kopie
  if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })));
  }
  // al de rest (database, lettertypes) gaat gewoon rechtstreeks naar het internet
});
