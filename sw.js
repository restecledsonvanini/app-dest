const CACHE = 'dest-v1';
const SHELL = [
  '/app-dest/', '/app-dest/ferramentas/',
  '/app-dest/src/js/main.js',
  '/app-dest/src/styles/global.css', '/app-dest/src/styles/ferramentas.css'
];

self.addEventListener('install',  e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(SHELL))
));

self.addEventListener('fetch', e => {
  // CNPJ lookup: sempre rede (nunca cachear dados externos)
  if (e.request.url.includes('brasilapi')) return;

  e.respondWith(
    caches.match(e.request).then(cached => cached ?? fetch(e.request))
  );
});