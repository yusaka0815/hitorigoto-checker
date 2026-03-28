const CACHE = 'hitorigoto-v5'; // バージョンを上げて古いキャッシュを強制削除
const FILES = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  // no-cacheでフェッチして確実に最新版をキャッシュ（HTTPキャッシュを回避）
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'no-cache' })))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// ネットワーク優先 + HTTPキャッシュを無効化
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(new Request(e.request, { cache: 'no-cache' }))
      .then(res => {
        if (res.ok) { // キャッシュには正常レスポンスのみ保存（404等を汚染しない）
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || Response.error()))
  );
});
