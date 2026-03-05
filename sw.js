const CACHE = 'dest-v1';
const SHELL = [
  './', './ferramentas/',
  './src/js/main.js',
  './src/styles/global.css', './src/styles/ferramentas.css'
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