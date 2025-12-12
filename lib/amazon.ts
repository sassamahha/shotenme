// lib/amazon.ts
import type { User } from '@prisma/client';

const DEFAULT_SASAKI_TAG =
  process.env.SASAKI_AFFILIATE_TAG ?? 'sasaki-22';

export function getAmazonLink(asin: string, user: User | null) {
  if (user && user.isPro && user.amazonAssociateTag) {
    return `https://www.amazon.co.jp/dp/${asin}?tag=${user.amazonAssociateTag}`;
  }

  return `https://www.amazon.co.jp/dp/${asin}?tag=${DEFAULT_SASAKI_TAG}`;
}
