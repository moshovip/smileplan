const CACHE = 'smileplan-v2';
const SHELL = ['/smileplan/', '/smileplan/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // For navigation requests — serve index.html (SPA routing)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match('/smileplan/').then(r => r || fetch('/smileplan/'))
      )
    );
    return;
  }
  // For other requests — network first, cache fallback
  e.respondWith(
    fetch(e.request).catch(() =>
      caches.match(e.request).then(r => r || new Response('', { status: 404 }))
    )
  );
});
