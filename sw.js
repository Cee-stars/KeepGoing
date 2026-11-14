/* =============================================================
   KeepGoing — Service Worker
   方針：オンラインのときは必ず最新を取りに行き（network-first）、
   取れなかったときだけキャッシュを返す。
   こうしないとデプロイしても古い画面が出続ける。
   ============================================================= */
const CACHE = 'keepgoing-v2';
const ASSETS = [
  './', './index.html',
  './css/tokens.css', './css/styles.css', './css/listening.css', './css/playlists.css',
  './data/words.js', './js/app.js', './js/listening.js', './js/playlists.js',
  './manifest.webmanifest',
  './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      // 1 つ失敗しても全体を落とさない
      .then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // 自分のサイトのファイルだけ扱う
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        // 取れたら控えを更新しておく（オフライン用）
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        // ネットワークが無いときだけキャッシュ。無ければトップを返す
        caches.match(req).then(hit => hit || caches.match('./index.html'))
      )
  );
});
