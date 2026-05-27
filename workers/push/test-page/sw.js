self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: 'Push', body: event.data?.text() || '' }; }
  const title = data.title || 'TuGym';
  const opts = {
    body: data.body || '',
    tag: data.tag || 'tugym',
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
