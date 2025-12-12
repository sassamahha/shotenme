// app/api/books/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/currentUser';
import {
  fetchBookMetaByIsbn,
  fetchBookMetaByAsin,
  normalizeIsbn,
  parseAsinFromAmazonUrl,
} from '@/lib/bookMeta';

type PostBody = {
  mode: 'isbn' | 'asin' | 'url';
  isbn?: string;
  asin?: string;
  url?: string;
  title?: string;
  author?: string;
  imageUrl?: string;
  comment?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody;

    const mode = body.mode;
    if (!mode || !['isbn', 'asin', 'url'].includes(mode)) {
      return NextResponse.json(
        { message: '登録モードが不正です。' },
        { status: 400 },
      );
    }

    // ★ SaaS 前提：ハードコードせず「現在のユーザー」を取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          message: '認証が必要です。',
        },
        { status: 401 },
      );
    }

    let asinKey: string;
    let isbn10ForDb: string | null = null;
    let isbn13ForDb: string | null = null;

    let finalTitle = body.title?.trim() ?? '';
    let finalAuthor = body.author?.trim() ?? '';
    let finalImageUrl = body.imageUrl?.trim() || null;

    const rawComment = body.comment?.trim() ?? '';
    const commentForDb = rawComment === '' ? null : rawComment;

    // --- mode ごとの前処理 ----------------------------------------

    if (mode === 'isbn') {
      const rawIsbn = body.isbn ?? '';
      const { isbn10, isbn13 } = normalizeIsbn(rawIsbn);
      if (!isbn10 && !isbn13) {
        return NextResponse.json(
          { message: 'ISBN の形式が不正です。' },
          { status: 400 },
        );
      }

      asinKey = (isbn10 ?? isbn13)!;
      isbn10ForDb = isbn10;
      isbn13ForDb = isbn13;

      // タイトル等が未入力なら ISBN から取得
      if (!finalTitle || !finalAuthor || !finalImageUrl) {
        const meta = await fetchBookMetaByIsbn(rawIsbn);
        if (!finalTitle && meta.title) finalTitle = meta.title;
        if (!finalAuthor && meta.author) finalAuthor = meta.author;
        if (!finalImageUrl && meta.imageUrl) finalImageUrl = meta.imageUrl;
      }
    } else if (mode === 'asin') {
      const rawAsin = (body.asin ?? '').trim();
      if (!rawAsin) {
        return NextResponse.json(
          { message: 'ASIN を入力してください。' },
          { status: 400 },
        );
      }
      asinKey = rawAsin.toUpperCase();

      // タイトル等が未入力なら ASIN から取得を試みる
      if (!finalTitle || !finalAuthor || !finalImageUrl) {
        const meta = await fetchBookMetaByAsin(asinKey);
        if (!finalTitle && meta.title) finalTitle = meta.title;
        if (!finalAuthor && meta.author) finalAuthor = meta.author;
        if (!finalImageUrl && meta.imageUrl) finalImageUrl = meta.imageUrl;
      }

      // ASIN が ISBN-10 形式の可能性がある場合は ISBN 情報も保存
      const possibleIsbn = asinKey.match(/^[0-9]{9}[0-9X]$/);
      if (possibleIsbn) {
        const { isbn10, isbn13 } = normalizeIsbn(asinKey);
        isbn10ForDb = isbn10;
        isbn13ForDb = isbn13;
      }
    } else {
      // mode === 'url'
      const rawUrl = (body.url ?? '').trim();
      if (!rawUrl) {
        return NextResponse.json(
          { message: 'URL を入力してください。' },
          { status: 400 },
        );
      }
      const asin = parseAsinFromAmazonUrl(rawUrl);
      if (!asin) {
        return NextResponse.json(
          { message: 'URL から ASIN を抽出できませんでした。' },
          { status: 400 },
        );
      }
      asinKey = asin;

      // タイトル等が未入力なら ASIN から取得を試みる
      if (!finalTitle || !finalAuthor || !finalImageUrl) {
        const meta = await fetchBookMetaByAsin(asinKey);
        if (!finalTitle && meta.title) finalTitle = meta.title;
        if (!finalAuthor && meta.author) finalAuthor = meta.author;
        if (!finalImageUrl && meta.imageUrl) finalImageUrl = meta.imageUrl;
      }

      // ASIN が ISBN-10 形式の可能性がある場合は ISBN 情報も保存
      const possibleIsbn = asinKey.match(/^[0-9]{9}[0-9X]$/);
      if (possibleIsbn) {
        const { isbn10, isbn13 } = normalizeIsbn(asinKey);
        isbn10ForDb = isbn10;
        isbn13ForDb = isbn13;
      }
    }

    if (!finalTitle) {
      finalTitle = asinKey; // 最低限、ASIN をタイトル代わりに
    }
    if (!finalAuthor) {
      finalAuthor = '著者情報なし';
    }

    // --- Book を upsert ----------------------------------------

    const book = await prisma.book.upsert({
      where: { asin: asinKey },
      update: {
        // 後から手入力で上書きもあり得るので、常に update する
        title: finalTitle,
        author: finalAuthor,
        imageUrl: finalImageUrl,
        isbn10: isbn10ForDb,
        isbn13: isbn13ForDb,
      },
      create: {
        asin: asinKey,
        isbn10: isbn10ForDb,
        isbn13: isbn13ForDb,
        title: finalTitle,
        author: finalAuthor,
        imageUrl: finalImageUrl,
      },
    });

    // 並び順：そのユーザーの最大 sortOrder + 1
    const agg = await prisma.userBook.aggregate({
      where: { userId: user.id },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (agg._max.sortOrder ?? 0) + 1;

    const userBook = await prisma.userBook.create({
      data: {
        userId: user.id,
        bookId: book.id,
        sortOrder: nextSortOrder,
        comment: commentForDb,
        isPublic: true,
      },
    });

    return NextResponse.json({ userBookId: userBook.id }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/books error', err);
    return NextResponse.json(
      {
        message: 'サーバーエラーが発生しました。',
        detail: err?.message ?? String(err),
      },
      { status: 500 },
    );
  }
}
