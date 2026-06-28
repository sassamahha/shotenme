// public/sw.js
// 最小サービスワーカー。PWA を installable にする（= share_target を有効化）ための fetch ハンドラのみ。
// キャッシュ戦略は今は持たない（のほほん運用 / 後で必要なら足す）。
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // ネットワークにそのまま委ねる（pass-through）。
});
