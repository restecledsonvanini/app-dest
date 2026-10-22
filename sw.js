const CACHE = 'dest-v2-20261005';
const SHELL = [
  './',
  './ferramentas/',
  './src/styles/global.css',
  './src/styles/ferramentas.css'
];

function shouldBypassCache(requestUrl) {
  if (!requestUrl) return true;

  const url = new URL(requestUrl, self.location.origin);
  const isExternal = url.origin !== self.location.origin;
  const isBrasilApi = url.hostname.includes('brasilapi') || url.pathname.includes('/cnpj/');
  const isDocumentRoute = /\.(docx|odt|pdf|zip)$/i.test(url.pathname);
  const isApiRoute = url.pathname.includes('/api/') || url.pathname.includes('/proxy');

  return isExternal || isBrasilApi || isDocumentRoute || isApiRoute;
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key !== CACHE)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error('Network unavailable and no cache entry found.');
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (!sameOrigin || shouldBypassCache(req.url)) {
    return;
  }

  const isNavigation = req.mode === 'navigate';
  const isCriticalAsset = req.destination === 'script' || req.destination === 'style';

  if (isNavigation || isCriticalAsset) {
    e.respondWith(networkFirst(req));
    return;
  }

  e.respondWith(cacheFirst(req));
});