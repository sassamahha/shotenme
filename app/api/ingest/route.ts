// app/api/ingest/route.ts
// 解決済みの本カードを棚（bookstore）に追加。obi（1行）＋ note（任意・長文）。
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/currentUser';
import type { ResolvedBook } from '@/lib/ingest';

type PostBody = {
  bookstoreId?: string; // 後方互換
  bookstoreIds?: string[]; // 複数棚に一気に追加（再生リスト感覚）
  book: ResolvedBook;
  obi?: string | null;
  note?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: '認証が必要です。' }, { status: 401 });
    }

    const body = (await req.json()) as PostBody;
    const { book } = body;

    // 単一/複数どちらの指定も受ける
    const requestedIds = body.bookstoreIds?.length
      ? body.bookstoreIds
      : body.bookstoreId
        ? [body.bookstoreId]
        : [];

    if (requestedIds.length === 0) {
      return NextResponse.json(
        { message: '棚（書店）が選択されていません。' },
        { status: 400 },
      );
    }
    if (!book || !book.canonicalKey) {
      return NextResponse.json(
        { message: '本が解決できていません。' },
        { status: 400 },
      );
    }

    // 所有している棚だけに絞る
    const bookstores = await prisma.bookstore.findMany({
      where: { id: { in: requestedIds }, ownerId: user.id },
      select: { id: true },
    });
    if (bookstores.length === 0) {
      return NextResponse.json(
        { message: '棚が見つかりません。' },
        { status: 404 },
      );
    }

    const obi = body.obi?.trim() || null;
    const note = body.note?.trim() || null;

    // Book を canonicalKey（= Book.asin フィールドを同定キーとして流用）で upsert（1回）
    const bookRow = await prisma.book.upsert({
      where: { asin: book.canonicalKey },
      update: {
        title: book.title,
        author: book.author,
        imageUrl: book.imageUrl,
        rakutenUrl: book.rakutenUrl,
        isbn10: book.isbn10,
        isbn13: book.isbn13,
      },
      create: {
        asin: book.canonicalKey,
        isbn10: book.isbn10,
        isbn13: book.isbn13,
        title: book.title,
        author: book.author,
        imageUrl: book.imageUrl,
        rakutenUrl: book.rakutenUrl,
      },
    });

    // 各棚に配置（既にあればスキップ）。obi/note は各棚で共通。
    let added = 0;
    let skipped = 0;
    for (const bs of bookstores) {
      const existing = await prisma.userBook.findUnique({
        where: {
          bookstoreId_bookId: { bookstoreId: bs.id, bookId: bookRow.id },
        },
      });
      if (existing) {
        skipped++;
        continue;
      }
      const agg = await prisma.userBook.aggregate({
        where: { bookstoreId: bs.id },
        _max: { sortOrder: true },
      });
      await prisma.userBook.create({
        data: {
          bookstoreId: bs.id,
          bookId: bookRow.id,
          sortOrder: (agg._max.sortOrder ?? 0) + 1,
          obi,
          note,
          isPublic: true,
        },
      });
      added++;
    }

    return NextResponse.json({ added, skipped }, { status: 201 });
  } catch (err) {
    console.error('POST /api/ingest error', err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました。', detail },
      { status: 500 },
    );
  }
}
