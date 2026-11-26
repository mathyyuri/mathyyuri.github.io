/* 학생 상담 앱 전용 서비스 워커 — 앱 설치를 위해 필요한 최소 기능만 있어요.
   · 이 앱의 화면(counsel.html)만 맡아요(범위 /counsel.html). 알림·캐시 저장은 하지 않아요 → 항상 최신 화면을 받고, 학생 정보는 기기에 저장하지 않아요.
   · 인터넷이 끊겼을 때만 안내 문구를 보여 줘요. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(clients.claim()); });
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || r.mode !== 'navigate') return;
  e.respondWith(fetch(r).catch(function () {
    return new Response('<!DOCTYPE html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:sans-serif;background:#f5efe4;color:#33281f;text-align:center;padding:30vh 20px"><h2>인터넷에 연결되어 있지 않아요</h2><p>연결을 확인한 뒤 다시 열어 주세요.</p>', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }));
});
