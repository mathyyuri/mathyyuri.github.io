/* MATHY YURI SYSTEM 서비스 워커: 앱 설치 · 알림 받기 (캐시는 인터넷이 끊겼을 때 첫 화면만 보여 주는 용도) */
const CACHE = 'mathy-v1';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.mode !== 'navigate') return;
  e.respondWith(fetch(r).then(res => {
    const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)).catch(() => {}); return res;
  }).catch(() => caches.match(r).then(x => x || new Response('인터넷에 연결되어 있지 않아요. 연결을 확인하고 다시 열어 주세요.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }))));
});
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch (_) { d = { title: 'MATHY YURI', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'MATHY YURI', {
    body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', data: { url: d.url || '/' }, tag: d.tag || undefined
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return clients.openWindow(url);
  }));
});
