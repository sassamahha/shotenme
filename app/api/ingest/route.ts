// app/api/ingest/route.ts
// 解決済みの本カードを棚（bookstore）に追加。obi（1行）＋ note（任意・長文）。
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/currentUser';
import type { ResolvedBook } from '@/lib/ingest';

type PostBody = {
  bookstoreId: string;
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
    const { bookstoreId, book } = body;

    if (!bookstoreId) {
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

    // 棚の存在と所有者チェック
    const bookstore = await prisma.bookstore.findFirst({
      where: { id: bookstoreId, ownerId: user.id },
    });
    if (!bookstore) {
      return NextResponse.json(
        { message: '棚が見つかりません。' },
        { status: 404 },
      );
    }

    const obi = body.obi?.trim() || null;
    const note = body.note?.trim() || null;

    // Book を canonicalKey（= Book.asin フィールドを同定キーとして流用）で upsert
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

    // 同じ棚に同じ本があれば、その UserBook を返す（多重登録しない）
    const existing = await prisma.userBook.findUnique({
      where: {
        bookstoreId_bookId: { bookstoreId: bookstore.id, bookId: bookRow.id },
      },
    });
    if (existing) {
      return NextResponse.json(
        { userBookId: existing.id, duplicated: true },
        { status: 200 },
      );
    }

    const agg = await prisma.userBook.aggregate({
      where: { bookstoreId: bookstore.id },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (agg._max.sortOrder ?? 0) + 1;

    const userBook = await prisma.userBook.create({
      data: {
        bookstoreId: bookstore.id,
        bookId: bookRow.id,
        sortOrder: nextSortOrder,
        obi,
        note,
        isPublic: true,
      },
    });

    return NextResponse.json({ userBookId: userBook.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/ingest error', err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました。', detail },
      { status: 500 },
    );
  }
}
