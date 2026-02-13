/**
 * サイト全体で使う基準 URL（OGP・絶対リンク用）
 * 本番: NEXT_PUBLIC_APP_ORIGIN または shoten.me
 */
export const siteOrigin =
  process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'https://shoten.me';
