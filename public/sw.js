const SHELL_CACHE = 'tugym-shell-v1';
const STATIC_CACHE = 'tugym-static-v1';

const PRECACHE_URLS = [
  '/',
  '/ejercicios',
  '/ejercicios/nuevo',
  '/ejercicios/editar',
  '/ejercicios/historial',
  '/entrenar',
  '/entrenar/nueva-rutina',
  '/entrenar/editar-rutina',
  '/entrenar/sesion',
  '/peso',
  '/manifest.webmanifest',
];

const ICON_PATHS = new Set([
  '/icon',
  '/icon1',
  '/icon2',
  '/apple-icon',
  '/favicon.ico',
]);

// Precache individual con allSettled: una URL que falle no aborta el install.
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))).then(
        (results) => {
          results.forEach((r, i) => {
            if (r.status === 'rejected') {
              console.warn('[sw] precache falló:', PRECACHE_URLS[i], r.reason);
            }
          });
        },
      ),
    ),
  );
});

// Borra caches de versiones viejas + chunks huérfanos; toma control de los clients.
self.addEventListener('activate', (event) => {
  const keep = [SHELL_CACHE, STATIC_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((n) => !keep.includes(n)).map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // RSC payloads de client-nav: nunca cachear, dejá pasar a red.
  if (url.pathname.includes('__next') && url.pathname.endsWith('.txt')) return;

  // Navegación: network-first con fallback a shell precacheado.
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigate(request, url));
    return;
  }

  // Assets de build inmutables: cache-first.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Iconos: stale-while-revalidate, ignorando el query hash que cambia por build.
  if (ICON_PATHS.has(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE, true));
    return;
  }

  // Manifest: cache-first.
  if (url.pathname === '/manifest.webmanifest') {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // Resto mismo-origen: passthrough.
});

async function handleNavigate(request, url) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(url.pathname, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match(url.pathname, { ignoreSearch: true });
    return cached || (await cache.match('/'));
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName, ignoreSearch) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch });
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached || (await network);
}
