// lib/rakuten.ts
// 楽天ブックス書籍検索API（BooksBook/Search）。
// 目的: 店長体験を「リンク貼るだけ / タイトル打つだけ」にする。高画質書影＋アフィリンク。
import type { AffiliateUser } from './amazon';

const ENDPOINT =
  'https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404';

const APP_ID = process.env.RAKUTEN_APP_ID;
const DEFAULT_AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID;

export type RakutenBook = {
  isbn13: string | null;
  title: string | null;
  author: string | null;
  imageUrl: string | null;
  rakutenUrl: string | null; // 商品ページURL（アフィ wrap の元）
};

type RakutenApiItem = {
  Item?: {
    isbn?: string;
    title?: string;
    author?: string;
    largeImageUrl?: string;
    mediumImageUrl?: string;
    itemUrl?: string;
  };
};

// largeImageUrl の末尾 `?_ex=200x200` を 400x400 に書き換えて高画質化
function upscaleImage(url: string | undefined | null): string | null {
  if (!url) return null;
  return url.replace(/_ex=\d+x\d+/, '_ex=400x400');
}

function toRakutenBook(item: RakutenApiItem['Item']): RakutenBook {
  return {
    isbn13: item?.isbn ?? null,
    title: item?.title ?? null,
    author: item?.author ?? null,
    imageUrl: upscaleImage(item?.largeImageUrl || item?.mediumImageUrl),
    rakutenUrl: item?.itemUrl ?? null,
  };
}

async function callApi(
  params: Record<string, string>,
): Promise<RakutenApiItem[]> {
  if (!APP_ID) {
    // 未設定なら静かにスキップ（openBD / Google Books へフォールバックさせる）
    return [];
  }
  const qs = new URLSearchParams({
    applicationId: APP_ID,
    formatVersion: '2',
    hits: '10',
    ...params,
  });
  try {
    const res = await fetch(`${ENDPOINT}?${qs.toString()}`, {
      next: { revalidate: 60 * 60 * 24 }, // 1日キャッシュ
    });
    if (!res.ok) return [];
    const json = await res.json();
    // formatVersion=2 では Items は配列（各要素が Item 本体）
    const items = Array.isArray(json.Items) ? json.Items : [];
    // formatVersion 差異を吸収（Item ラップの有無）
    return items.map((it: unknown) =>
      it && typeof it === 'object' && 'Item' in it
        ? (it as RakutenApiItem)
        : { Item: it as RakutenApiItem['Item'] },
    );
  } catch (e) {
    console.error('Rakuten API error', e);
    return [];
  }
}

/** ISBN（13/10）から1冊を解決 */
export async function fetchRakutenBookByIsbn(
  isbn: string,
): Promise<RakutenBook | null> {
  const items = await callApi({ isbnjan: isbn });
  if (items.length === 0) return null;
  return toRakutenBook(items[0].Item);
}

/** キーワード（タイトル等）から候補配列を返す。Threads にタイトルしか無い時の主経路。 */
export async function searchRakutenBooksByKeyword(
  q: string,
): Promise<RakutenBook[]> {
  const query = q.trim();
  if (!query) return [];
  const items = await callApi({ title: query, sort: 'standard' });
  return items
    .map((it) => toRakutenBook(it.Item))
    .filter((b) => b.title);
}

/**
 * 楽天アフィリンクを生成。
 * free=運営タグ（env RAKUTEN_AFFILIATE_ID）/ pro=ユーザー自身の rakutenAffiliateId。
 * rakutenUrl が無い、または affiliateId が無ければ素のURL（or null）を返す。
 */
export function getRakutenLink(
  rakutenUrl: string | null | undefined,
  user: AffiliateUser | null,
): string | null {
  if (!rakutenUrl) return null;

  const affiliateId =
    user?.isPro && user.rakutenAffiliateId
      ? user.rakutenAffiliateId
      : DEFAULT_AFFILIATE_ID;

  if (!affiliateId) return rakutenUrl; // タグ未設定でも導線は残す

  return `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${encodeURIComponent(
    rakutenUrl,
  )}&link_type=hybrid_url`;
}
