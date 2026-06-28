// lib/flags.ts
// リビルド中のメンテナンスゲート。
// true の間は、未ログインの訪問者は公開ページ（/ と /@handle）で「準備中」に飛ばす。
// ログイン中（＝運営=Jun）は素通しなので、棚のドッグフード検証はそのままできる。
// 公開ローンチの準備が整ったら false にして commit/push するだけ。
export const MAINTENANCE = true;
