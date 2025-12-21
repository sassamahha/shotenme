// app/api/user-books/reorder/route.ts
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/currentUser';

export async function PATCH(req: Request) {
  const { userBookIds, bookstoreId } = await req.json();

  if (!Array.isArray(userBookIds)) {
    return NextResponse.json(
      { message: 'userBookIds は配列で送ってください。' },
      { status: 400 },
    );
  }

  if (!bookstoreId) {
    return NextResponse.json(
      { message: 'bookstoreId が必要です。' },
      { status: 400 },
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { message: '認証が必要です。' },
      { status: 401 },
    );
  }

  // 書店が存在し、所有者であることを確認
  const bookstore = await prisma.bookstore.findFirst({
    where: {
      id: bookstoreId,
      ownerId: user.id,
    },
    select: { id: true, handle: true },
  });

  if (!bookstore) {
    return NextResponse.json(
      { message: '書店が見つかりません。' },
      { status: 404 },
    );
  }

  // マルチテナント隔離：指定されたすべてのuserBookIdsが現在の書店のものかチェック
  const userBooks = await prisma.userBook.findMany({
    where: {
      id: { in: userBookIds },
      bookstoreId: bookstore.id,
    },
    select: { id: true, bookstoreId: true },
  });

  // 指定されたIDの数と取得できた数が一致しない場合（存在しないIDが含まれている）
  if (userBooks.length !== userBookIds.length) {
    return NextResponse.json(
      { message: '一部の本が見つかりませんでした。' },
      { status: 404 },
    );
  }

  // 指定された順番どおりに 1,2,3... を振り直す
  await prisma.$transaction(
    userBookIds.map((id: string, index: number) =>
      prisma.userBook.update({
        where: { id, bookstoreId: bookstore.id }, // bookstoreIdも条件に含める（二重チェック）
        data: { sortOrder: index + 1 },
      }),
    ),
  );

  // 公開ページのキャッシュをクリア（handleが設定されている場合）
  if (bookstore.handle) {
    revalidatePath(`/u/${bookstore.handle}`);
    revalidatePath(`/@${bookstore.handle}`);
  }

  return NextResponse.json({ ok: true });
}