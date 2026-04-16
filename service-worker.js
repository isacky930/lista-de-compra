const CACHE_STATIC = 'static-v2';
const CACHE_DYNAMIC = 'dynamic-v2';

// Arquivos essenciais
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/src/1/css/index.css',
  '/src/1/css/login.css',
  '/app.js',
  '/auth.js',
  '/manifest.json'
];

// ============================
// INSTALL
// ============================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );

  self.skipWaiting();
});

// ============================
// ACTIVATE
// ============================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_STATIC && key !== CACHE_DYNAMIC) {
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// ============================
// FETCH
// ============================
self.addEventListener('fetch', event => {
  const req = event.request;

  // HTML → network first (sempre atualizado)
  if (req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // CSS/JS → cache first
  if (
    req.url.includes('.css') ||
    req.url.includes('.js')
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Outros → network fallback cache
  event.respondWith(networkWithCache(req));
});

// ============================
// STRATEGIES
// ============================

async function cacheFirst(req) {
  const cache = await caches.open(CACHE_STATIC);
  const cached = await cache.match(req);

  return cached || fetch(req);
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE_DYNAMIC);

  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(req);
    return cached || caches.match('/index.html');
  }
}

async function networkWithCache(req) {
  const cache = await caches.open(CACHE_DYNAMIC);

  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    return cache.match(req);
  }
}