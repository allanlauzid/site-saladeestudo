// Service worker do PWA do Admin (Sala de Estudo).
// Guarda só o "casco" do app (HTML/CSS/JS/ícones locais) para abrir
// rápido e funcionar como app instalável. Tudo que é dado (Supabase,
// APIs, imagens da galeria hospedadas) sempre vai direto pra rede —
// nunca fica em cache, pra nunca mostrar conteúdo desatualizado.
const CACHE_NAME = 'sde-admin-shell-v1';
const SHELL_FILES = [
  'admin.html',
  'styles.css',
  'admin-gallery.css',
  'admin-gallery.js',
  'post-image-assets.js',
  'manifest.webmanifest',
  'icons/pwa/icon-192.png',
  'icons/pwa/icon-512.png',
  'icons/pwa/icon-512-maskable.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(SHELL_FILES).catch(function () {
        // Se algum arquivo do casco falhar (ex.: ainda não existe),
        // não trava a instalação do service worker por causa disso.
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (name) { return name !== CACHE_NAME; })
             .map(function (name) { return caches.delete(name); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Só cuida do casco do próprio site (mesma origem). Supabase, CDNs de
  // fontes/ícones e qualquer outra origem sempre vão direto pra rede.
  if (url.origin !== self.location.origin) return;

  const isShellFile = SHELL_FILES.some(function (path) {
    return url.pathname.endsWith('/' + path) || url.pathname.endsWith(path);
  });
  if (!isShellFile) return;

  // Network-first: tenta buscar a versão mais nova; só cai pro cache
  // (última versão salva) se a rede falhar (offline ou instabilidade).
  event.respondWith(
    fetch(req).then(function (response) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
      return response;
    }).catch(function () {
      return caches.match(req);
    })
  );
});
