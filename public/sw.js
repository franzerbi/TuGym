const SHELL_CACHE = 'tugym-shell-v3';
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
  '/settings',
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

// Push real desde el server (Cloudflare Worker + DO). Si el browser entrega un push,
// mostramos la notif acá; el handler de notificationclick es el mismo que el local.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'TuGym', body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration
      .showNotification(data.title || 'Descanso terminado', {
        body: data.body || 'Próxima serie',
        tag: 'rest-timer',
        renotify: false,
        vibrate: [200, 100, 200],
        icon: '/icon1',
        badge: '/icon1',
        data: { url: data.url || '/entrenar/sesion' },
        silent: false,
      })
      .catch(() => undefined),
  );
});

// iOS/Safari y otros pueden rotar la subscription. Avisamos a los clients para re-registrar.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
      clientsList.forEach((c) => c.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' }));
    })(),
  );
});

// Rest timer: la app pide armar la notif al irse a background; al volver pide desarmarla.
let restTimerTimeout = null;

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'ARM_REST_NOTIF') {
    if (restTimerTimeout) clearTimeout(restTimerTimeout);
    const delay = data.endsAt - Date.now();
    // Si ya pasó el endsAt, no armar: la app está volviendo a foreground y el disarm/banner se encarga.
    if (delay <= 250) {
      restTimerTimeout = null;
      return;
    }
    restTimerTimeout = setTimeout(() => {
      self.registration
        .showNotification('Descanso terminado', {
          body: data.exerciseName ? `Próxima serie: ${data.exerciseName}` : 'Volvé a la app',
          tag: 'rest-timer',
          renotify: false,
          vibrate: [200, 100, 200],
          icon: '/icon1',
          badge: '/icon1',
          data: { url: data.returnUrl || '/entrenar/sesion' },
          silent: false,
        })
        .catch(() => undefined);
      restTimerTimeout = null;
    }, delay);
  } else if (data.type === 'DISARM_REST_NOTIF') {
    if (restTimerTimeout) {
      clearTimeout(restTimerTimeout);
      restTimerTimeout = null;
    }
    self.registration.getNotifications({ tag: 'rest-timer' }).then((ns) =>
      ns.forEach((n) => n.close()),
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  if (event.notification.tag !== 'rest-timer') return;
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      const existing = wins.find((w) => w.url.includes(url));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    }),
  );
});
