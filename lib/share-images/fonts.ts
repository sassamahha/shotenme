/**
 * シェア用画像（Vercel OG）で使うフォントの取得・キャッシュ
 * Satori は TTF / OTF / WOFF をサポート（WOFF2 は非対応）
 * japanese サブセットは WOFF が無いため、Latin WOFF で画像を確実に生成する
 */
const NOTO_SANS_JP_400_URL =
  'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.8/files/noto-sans-jp-latin-400-normal.woff';
const NOTO_SANS_JP_700_URL =
  'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.8/files/noto-sans-jp-latin-700-normal.woff';

export const SHARE_IMAGE_FONT_NAME = 'Noto Sans JP';

type CachedFont = {
  data: ArrayBuffer;
  weight: number;
  style: string;
};

let fontCache: CachedFont[] | null = null;

/**
 * シェア用画像レンダリングで使うフォント配列を返す。初回のみ fetch し、メモリにキャッシュする。
 */
export async function getShareImageFonts(): Promise<
  { name: string; data: ArrayBuffer; weight: number; style: string }[]
> {
  if (fontCache) {
    return fontCache.map((f) => ({
      name: SHARE_IMAGE_FONT_NAME,
      data: f.data,
      weight: f.weight,
      style: f.style,
    }));
  }

  let data400: ArrayBuffer;
  let data700: ArrayBuffer;
  try {
    const [res400, res700] = await Promise.all([
      fetch(NOTO_SANS_JP_400_URL),
      fetch(NOTO_SANS_JP_700_URL),
    ]);
    if (!res400.ok || !res700.ok) {
      throw new Error('Font fetch not ok');
    }
    const buffers = await Promise.all([
      res400.arrayBuffer(),
      res700.arrayBuffer(),
    ]);
    data400 = buffers[0];
    data700 = buffers[1];
  } catch (e) {
    console.warn('Share image fonts: could not fetch Noto Sans JP, using fallback', e);
    return [];
  }

  fontCache = [
    { data: data400, weight: 400, style: 'normal' },
    { data: data700, weight: 700, style: 'normal' },
  ];

  return fontCache.map((f) => ({
    name: SHARE_IMAGE_FONT_NAME,
    data: f.data,
    weight: f.weight,
    style: f.style,
  }));
}
