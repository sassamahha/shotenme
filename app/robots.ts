// app/robots.ts
import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/site';
import { MAINTENANCE } from '@/lib/flags';

export default function robots(): MetadataRoute.Robots {
  // リビルド中はクロールさせない（index 面を汚さない）
  if (MAINTENANCE) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/api/'],
    },
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
