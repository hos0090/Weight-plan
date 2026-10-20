const CACHE = 'myz-1792516919283';
const SHELL = [
  './', './index.html', './style.css', './app.js', './main.js', './bridge.js', './sync.js',
  './worker.js', './gas-runtime.js', './engine.js', './engine-ext.js', './claude-ai.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).catch(function () {}));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // الشبكات الخارجية (الذكاء الاصطناعي، المزامنة) تمر كما هي
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      const net = fetch(e.request).then(function (res) {
        if (res && res.ok) caches.open(CACHE).then(function (c) { c.put(e.request, res.clone()); });
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});

self.addEventListener('push', function (e) {
  let d = {};
  try { d = e.data.json(); } catch (err) { d = { title: 'ميزانيتي', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'ميزانيتي', {
    body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag || undefined, lang: 'ar', dir: 'rtl', data: { url: './' }
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (ws) {
    for (const w of ws) { if ('focus' in w) return w.focus(); }
    return self.clients.openWindow('./');
  }));
});
