// lib/amazon.ts
// 注意: 画像は Amazon から取らない（規約リスク回避）。書影は楽天/openBD/Google を使う。
// ここはアフィリンク生成だけを担う。free=運営タグ / pro=ユーザー自身のタグ。

const DEFAULT_SASAKI_TAG =
  process.env.SASAKI_AFFILIATE_TAG ?? 'sasaki-22';

// アフィタグ判定に必要な最小形（User 全体は要らない）
export type AffiliateUser = {
  isPro: boolean;
  amazonAssociateTag: string | null;
  rakutenAffiliateId?: string | null;
};

export function getAmazonLink(asin: string, user: AffiliateUser | null) {
  if (user && user.isPro && user.amazonAssociateTag) {
    return `https://www.amazon.co.jp/dp/${asin}?tag=${user.amazonAssociateTag}`;
  }

  return `https://www.amazon.co.jp/dp/${asin}?tag=${DEFAULT_SASAKI_TAG}`;
}
