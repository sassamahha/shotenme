// lib/ingest.ts
// 共有リンク投入の核：貼られた1本の文字列（URL/ISBN/タイトル）を本カードに解決する。
// 生成UIを触らせない＝ここがリンク→実体化の心臓部。
import {
  normalizeIsbn,
  isbn10To13,
  isbn13To10,
  asinToIsbn,
  fetchBookMetaByIsbn,
  searchGoogleBooksByKeyword,
  parseAsinFromAmazonUrl,
} from './bookMeta';
import { searchRakutenBooksByKeyword } from './rakuten';

export type ResolvedBook = {
  // 同定キー（ISBN13 があればそれ。なければ ISBN10/ASIN）。Book.asin として upsert する。
  canonicalKey: string;
  asin: string | null;
  isbn10: string | null;
  isbn13: string | null;
  title: string;
  author: string;
  imageUrl: string | null;
  rakutenUrl: string | null;
};

export type ResolveResult = {
  // single: URL/ISBN から1冊確定 / multiple: タイトル検索の候補列
  kind: 'single' | 'multiple' | 'none';
  candidates: ResolvedBook[];
};

// 文字列中の ISBN（13/10）を拾う（楽天URL等に埋まっているケース）
function extractIsbnFromText(text: string): string | null {
  const digits = text.replace(/[-\s]/g, '');
  const m13 = digits.match(/97[89][0-9]{10}/);
  if (m13) return m13[0];
  const m10 = digits.match(/[0-9]{9}[0-9Xx]/);
  if (m10) return m10[0];
  return null;
}

function buildKeys(opts: {
  isbn10?: string | null;
  isbn13?: string | null;
  asin?: string | null;
}): Pick<ResolvedBook, 'canonicalKey' | 'asin' | 'isbn10' | 'isbn13'> {
  let { isbn10, isbn13 } = opts;
  const { asin } = opts;
  // ISBN13 へ寄せて、Amazon(ISBN10) / 楽天(ISBN13) の重複登録を防ぐ（同定キー）
  if (!isbn13 && isbn10) isbn13 = isbn10To13(isbn10);
  // Amazon /dp/ は ISBN10 を受けるので、13しか無いときは10を復元しておく
  if (isbn13 && !isbn10 && isbn13.startsWith('978')) {
    isbn10 = isbn13To10(isbn13);
  }
  const canonicalKey = (isbn13 ?? isbn10 ?? asin)!;
  return {
    canonicalKey,
    asin: asin ?? null,
    isbn10: isbn10 ?? null,
    isbn13: isbn13 ?? null,
  };
}

async function resolveByIsbn(rawIsbn: string): Promise<ResolvedBook | null> {
  const { isbn10, isbn13 } = normalizeIsbn(rawIsbn);
  if (!isbn10 && !isbn13) return null;
  const meta = await fetchBookMetaByIsbn(rawIsbn);
  const keys = buildKeys({ isbn10, isbn13 });
  return {
    ...keys,
    title: meta.title?.trim() || keys.canonicalKey,
    author: meta.author?.trim() || '著者情報なし',
    imageUrl: meta.imageUrl ?? null,
    rakutenUrl: meta.rakutenUrl ?? null,
  };
}

/**
 * 貼られた1本の入力を解決する。
 * - Amazon URL → ASIN（本なら ISBN として扱う）
 * - 楽天 URL / 任意テキスト中の ISBN → ISBN
 * - 生 ISBN → ISBN
 * - それ以外の文字列 → 楽天キーワード検索で候補列
 */
export async function resolveInput(inputRaw: string): Promise<ResolveResult> {
  const input = inputRaw.trim();
  if (!input) return { kind: 'none', candidates: [] };

  const isUrl = /^https?:\/\//i.test(input);

  if (isUrl) {
    // Amazon
    const asin = parseAsinFromAmazonUrl(input);
    if (asin) {
      const maybeIsbn = asinToIsbn(asin);
      if (maybeIsbn) {
        const book = await resolveByIsbn(maybeIsbn);
        if (book) {
          book.asin = asin; // Amazon導線用に ASIN も保持
          return { kind: 'single', candidates: [book] };
        }
      }
      // ISBN化できない ASIN（Kindle等）：書影なしカードでも導線は残す
      const keys = buildKeys({ asin });
      return {
        kind: 'single',
        candidates: [
          {
            ...keys,
            title: asin,
            author: '著者情報なし',
            imageUrl: null,
            rakutenUrl: null,
          },
        ],
      };
    }
    // 楽天 or その他URL：URL中の ISBN を試す
    const isbn = extractIsbnFromText(input);
    if (isbn) {
      const book = await resolveByIsbn(isbn);
      if (book) return { kind: 'single', candidates: [book] };
    }
    return { kind: 'none', candidates: [] };
  }

  // 生 ISBN
  const { isbn10, isbn13 } = normalizeIsbn(input);
  if (isbn10 || isbn13) {
    const book = await resolveByIsbn(input);
    if (book) return { kind: 'single', candidates: [book] };
  }

  // タイトル等のキーワード → まず楽天、空なら Google Books（楽天キー無しでも探せる）
  const rkHits = await searchRakutenBooksByKeyword(input);
  let candidates: ResolvedBook[] = rkHits
    .filter((h) => h.isbn13)
    .map((h) => {
      const keys = buildKeys({ isbn13: h.isbn13 });
      return {
        ...keys,
        title: h.title?.trim() || keys.canonicalKey,
        author: h.author?.trim() || '著者情報なし',
        imageUrl: h.imageUrl,
        rakutenUrl: h.rakutenUrl,
      };
    });

  if (candidates.length === 0) {
    const ggHits = await searchGoogleBooksByKeyword(input);
    candidates = ggHits
      .filter((h) => h.isbn13 || h.isbn10)
      .map((h) => {
        const keys = buildKeys({ isbn13: h.isbn13, isbn10: h.isbn10 });
        return {
          ...keys,
          title: h.title?.trim() || keys.canonicalKey,
          author: h.author?.trim() || '著者情報なし',
          imageUrl: h.imageUrl,
          rakutenUrl: null,
        };
      });
  }

  return { kind: candidates.length ? 'multiple' : 'none', candidates };
}
