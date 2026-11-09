/* MATHY YURI SYSTEM 서비스 워커: 앱 설치 · 알림 받기 (캐시는 인터넷이 끊겼을 때 첫 화면만 보여 주는 용도) */
const CACHE = 'mathy-v1';
/* 알림 주소가 만료돼 새로 받았을 때, 로그인 없이 서버에 이어 주기 위한 공개 값 (사이트에도 들어 있는 값) */
const SB_URL = 'https://eqllmvfbcdtzercliicy.supabase.co';
const SB_KEY = 'sb_publishable_OcoOR7ERpt8BFBLuQ2CoWw_lELDDCEV';
const VAPID_PUB = 'BCTCEwzngOCtZ5aUjVxHt6MjS8eeXudgj_Fg1p87cG0w51lVVzun6wlP0KN6-zrTHd5pkmBJFCYn7nTCcqzFzDA';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.mode !== 'navigate') return;
  e.respondWith(fetch(r).then(res => {
    const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)).catch(() => {}); return res;
  }).catch(() => caches.match(r).then(x => x || new Response('인터넷에 연결되어 있지 않아요. 연결을 확인하고 다시 열어 주세요.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }))));
});

/* 알림 내용으로 눌렀을 때 열 화면을 정해요: 메시지 / 지시사항 / 소식 (앱 안 탭 이름) */
function goOf(d) {
  if (d.go) return d.go;
  const t = String(d.title || '');
  if (/지시사항/.test(t)) return 'todo';
  if (/메시지/.test(t)) return 'msg';
  if (/공지|수업결과|행사|소식/.test(t)) return 'feed';
  return '';
}
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch (_) { d = { title: 'MATHY YURI', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'MATHY YURI', {
    body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', data: { url: d.url || '/', go: goOf(d) }, tag: d.tag || undefined
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const data = e.notification.data || {};
  const go = data.go || '';
  const url = go ? '/?go=' + go : (data.url || '/');
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if ('focus' in c) {
        if (go) { try { c.postMessage({ type: 'go', go }); } catch (_) {} }
        return c.focus();
      }
    }
    return clients.openWindow(url);
  }));
});

/* ── 알림 주소가 만료돼 바뀌었을 때(로그인이 풀려 있어도) 자동으로 서버에 이어 주기 ── */
function idbGet(k) {
  return new Promise(res => {
    try {
      const q = indexedDB.open('mathy_auth', 1);
      q.onupgradeneeded = () => q.result.createObjectStore('kv');
      q.onsuccess = () => {
        try { const g = q.result.transaction('kv').objectStore('kv').get(k); g.onsuccess = () => res(g.result == null ? null : g.result); g.onerror = () => res(null); }
        catch (_) { res(null); }
      };
      q.onerror = () => res(null);
    } catch (_) { res(null); }
  });
}
function b64u(s) {
  const p = '='.repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')), u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
}
self.addEventListener('pushsubscriptionchange', e => {
  e.waitUntil((async () => {
    const sec = await idbGet('dsec');
    if (!sec) return;   // 이 기기에서 알림을 켠 적이 없으면 할 일 없음
    let sub = e.newSubscription || null;
    if (!sub) {
      try { sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID_PUB) }); }
      catch (_) { try { sub = await self.registration.pushManager.getSubscription(); } catch (__) {} }
    }
    if (!sub) return;
    const k = sub.toJSON();
    await fetch(SB_URL + '/rest/v1/rpc/ac_push_renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY },
      body: JSON.stringify({ p_secret: sec, p_new: { endpoint: k.endpoint, p256dh: k.keys.p256dh, auth: k.keys.auth } })
    }).catch(() => {});
  })());
});
