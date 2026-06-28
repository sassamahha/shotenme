// lib/bookMeta.ts
import { fetchRakutenBookByIsbn } from './rakuten';

export type BookMeta = {
  title: string | null;
  author: string | null;
  imageUrl: string | null;
  rakutenUrl?: string | null; // 楽天由来のときだけ埋まる
};

/**
 * 余計なハイフンなどを除去して ISBN を正規化
 */
export function normalizeIsbn(
  raw: string,
): { isbn10: string | null; isbn13: string | null } {
  const only = raw.replace(/[^0-9Xx]/g, '').toUpperCase();

  if (only.length === 13) {
    const isbn13 = only;
    const isbn10 = only.startsWith('978') ? isbn13To10(only) : null;
    return { isbn10, isbn13 };
  }

  if (only.length === 10) {
    return { isbn10: only, isbn13: null };
  }

  return { isbn10: null, isbn13: null };
}

/**
 * ASIN が ISBN-10 形式かどうかを判定し、ISBN として扱えるかチェック
 */
export function asinToIsbn(asin: string): string | null {
  const clean = asin.trim().toUpperCase();
  // ASIN は10文字の英数字
  if (clean.length !== 10) return null;
  // 数字のみ、または最後がXで残りが数字の場合は ISBN-10 の可能性がある
  if (/^[0-9]{9}[0-9X]$/.test(clean)) {
    return clean;
  }
  return null;
}

/**
 * ISBN-13 → ISBN-10 変換（978 プレフィックス前提）
 */
export function isbn13To10(isbn13: string): string | null {
  const clean = isbn13.replace(/[^0-9]/g, '');
  if (clean.length !== 13 || !clean.startsWith('978')) return null;

  const core = clean.slice(3, 12); // 9桁
  let sum = 0;
  for (let i = 0; i < core.length; i++) {
    const d = Number(core[i]);
    if (Number.isNaN(d)) return null;
    sum += d * (10 - i);
  }
  const mod = 11 - (sum % 11);
  let check: string;
  if (mod === 10) check = 'X';
  else if (mod === 11) check = '0';
  else check = String(mod);

  return core + check;
}

/**
 * ISBN-10 → ISBN-13 変換（978 プレフィックスを付与）
 */
export function isbn10To13(isbn10: string): string | null {
  const clean = isbn10.replace(/[^0-9Xx]/g, '').toUpperCase();
  if (clean.length !== 10) return null;
  const core = '978' + clean.slice(0, 9); // 12桁
  let sum = 0;
  for (let i = 0; i < core.length; i++) {
    const d = Number(core[i]);
    if (Number.isNaN(d)) return null;
    sum += d * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return core + String(check);
}

/**
 * ISBN からタイトル・著者・カバー画像を（楽天 → OpenBD → Google Books の順に）取得
 * 取れなかった項目は null で返す
 */
export async function fetchBookMetaByIsbn(isbnRaw: string): Promise<BookMeta> {
  const { isbn10, isbn13 } = normalizeIsbn(isbnRaw);
  const queryIsbn = isbn13 ?? isbn10;
  if (!queryIsbn) {
    return { title: null, author: null, imageUrl: null };
  }

  // 0. 楽天ブックス（高画質書影＋商品URL。最優先）
  try {
    const r = await fetchRakutenBookByIsbn(queryIsbn);
    if (r && (r.title || r.imageUrl)) {
      return {
        title: r.title,
        author: r.author,
        imageUrl: r.imageUrl,
        rakutenUrl: r.rakutenUrl,
      };
    }
  } catch (e) {
    console.error('Rakuten meta error', e);
  }

  // 1. OpenBD
  try {
    const res = await fetch(`https://api.openbd.jp/v1/get?isbn=${queryIsbn}`, {
      next: { revalidate: 60 * 60 * 24 }, // 1日キャッシュ
    });
    if (res.ok) {
      const json = await res.json();
      const summary = Array.isArray(json) ? json[0]?.summary : undefined;
      if (summary) {
        return {
          title: summary.title ?? null,
          author: summary.author ?? null,
          imageUrl: summary.cover ?? null,
        };
      }
    }
  } catch (e) {
    console.error('OpenBD error', e);
  }

  // 2. Google Books
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${queryIsbn}`,
      { next: { revalidate: 60 * 60 * 24 } },
    );
    if (res.ok) {
      const json = await res.json();
      const info = json.items?.[0]?.volumeInfo;
      if (info) {
        return {
          title: info.title ?? null,
          author: Array.isArray(info.authors) ? info.authors[0] ?? null : null,
          imageUrl: info.imageLinks?.thumbnail ?? null,
        };
      }
    }
  } catch (e) {
    console.error('Google Books error', e);
  }

  return { title: null, author: null, imageUrl: null };
}

/**
 * ASIN からタイトル・著者・カバー画像を取得
 * ASIN が ISBN-10 形式の場合は ISBN として取得を試みる
 */
export async function fetchBookMetaByAsin(asin: string): Promise<BookMeta> {
  // ASIN が ISBN-10 形式の可能性がある場合は、ISBN として取得を試みる
  const possibleIsbn = asinToIsbn(asin);
  if (possibleIsbn) {
    const meta = await fetchBookMetaByIsbn(possibleIsbn);
    // 取得できた場合はそれを返す
    if (meta.title || meta.author || meta.imageUrl) {
      return meta;
    }
  }

  // ISBN として取得できなかった場合は、null を返す
  // （将来的に Amazon Product Advertising API などを使用する場合はここで実装）
  return { title: null, author: null, imageUrl: null };
}

export type KeywordHit = {
  isbn13: string | null;
  isbn10: string | null;
  title: string | null;
  author: string | null;
  imageUrl: string | null;
};

/**
 * Google Books のキーワード検索（楽天が使えない/空のときのフォールバック）。
 * タイトル文字列から候補配列を返す。ISBN は industryIdentifiers から拾う。
 */
export async function searchGoogleBooksByKeyword(
  q: string,
): Promise<KeywordHit[]> {
  const query = q.trim();
  if (!query) return [];
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query,
      )}&maxResults=10&langRestrict=ja&country=JP`,
      { next: { revalidate: 60 * 60 * 24 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const items = Array.isArray(json.items) ? json.items : [];
    return items
      .map((it: { volumeInfo?: Record<string, unknown> }): KeywordHit | null => {
        const info = it.volumeInfo;
        if (!info) return null;
        const ids = Array.isArray(info.industryIdentifiers)
          ? (info.industryIdentifiers as { type: string; identifier: string }[])
          : [];
        const isbn13 = ids.find((x) => x.type === 'ISBN_13')?.identifier ?? null;
        const isbn10 = ids.find((x) => x.type === 'ISBN_10')?.identifier ?? null;
        const imageLinks = info.imageLinks as
          | { thumbnail?: string; smallThumbnail?: string }
          | undefined;
        const rawImage = imageLinks?.thumbnail || imageLinks?.smallThumbnail || null;
        return {
          isbn13,
          isbn10,
          title: (info.title as string) ?? null,
          author: Array.isArray(info.authors)
            ? ((info.authors as string[])[0] ?? null)
            : null,
          // http で来ることがあるので https に寄せる
          imageUrl: rawImage ? rawImage.replace(/^http:/, 'https:') : null,
        };
      })
      .filter((h: KeywordHit | null): h is KeywordHit => !!h && !!h.title);
  } catch (e) {
    console.error('Google Books keyword error', e);
    return [];
  }
}

/**
 * Amazon URL から ASIN を抽出してメタデータを取得
 */
export function parseAsinFromAmazonUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    const m = u.pathname.match(/\/([A-Z0-9]{10})(?:[/?]|$)/i);
    if (m) return m[1].toUpperCase();
  } catch {
    // 無視
  }
  return null;
}
