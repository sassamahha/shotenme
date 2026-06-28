// app/sitemap.ts
// 公開棚（公開本を1冊以上持つ書店）＋ home を動的にサイトマップ化。
// 多対多で面が増える前提（赤い表紙棚/犬棚/3回読んだ棚…）に SEO がそのまま乗る。
import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { siteOrigin } from '@/lib/site';

// 棚が増えるたびに反映したいので、ビルド時固定にしない
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const bookstores = await prisma.bookstore.findMany({
    where: {
      handle: { not: null },
      books: { some: { isPublic: true } },
    },
    select: { handle: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  const shelfEntries: MetadataRoute.Sitemap = bookstores.map((b) => ({
    url: `${siteOrigin}/@${b.handle}`,
    lastModified: b.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: siteOrigin,
      changeFrequency: 'daily',
      priority: 1,
    },
    ...shelfEntries,
  ];
}
