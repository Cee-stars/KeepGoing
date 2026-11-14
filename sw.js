/* =============================================================
   KeepGoing — Service Worker
   方針：オンラインのときは必ず最新を取りに行き（network-first）、
   取れなかったときだけキャッシュを返す。
   こうしないとデプロイしても古い画面が出続ける。
   ============================================================= */
const CACHE = 'keepgoing-v4';
// index.html と同じ ?v= を付ける。付けないと別URL扱いで二重に持つことになる。
const V = '?v=4';
const ASSETS = [
  './', './index.html',
  './css/tokens.css' + V, './css/styles.css' + V,
  './css/listening.css' + V, './css/playlists.css' + V,
  './data/words.js' + V, './js/app.js' + V,
  './js/listening.js' + V, './js/playlists.js' + V,
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

  // ブラウザの HTTP キャッシュを飛ばして必ずサーバーに聞く。
  // （navigate リクエストでは Request を作り直せないことがあるので素の fetch に戻す）
  let fresh;
  try { fresh = fetch(req, { cache: 'reload' }); }
  catch (err) { fresh = fetch(req); }

  e.respondWith(
    fresh
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
