// app/api/user-books/[userBookId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/currentUser';

type RouteContext =
  | { params: { userBookId: string } }
  | { params: Promise<{ userBookId: string }> };

// 共通：params が Promise なパターンにも対応
async function getUserBookId(params: RouteContext['params']): Promise<string> {
  const resolved = params instanceof Promise ? await params : params;
  return resolved.userBookId;
}

// PATCH: 本のメタ情報 & コメントを更新
export async function PATCH(req: Request, ctx: RouteContext) {
  try {
    // 認証チェック
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { message: '認証が必要です。' },
        { status: 401 },
      );
    }

    const userBookId = await getUserBookId(ctx.params);

    if (!userBookId) {
      return NextResponse.json(
        { message: 'userBookId is required' },
        { status: 400 },
      );
    }

    const body = await req.json();
    const {
      title,
      author,
      imageUrl, // ← 商品画像 URL として使う
      comment,
      isPublic,
    } = body as {
      title?: string;
      author?: string;
      imageUrl?: string | null;
      comment?: string | null;
      isPublic?: boolean;
    };

    // 1. 対象の UserBook + Book + Bookstore を取得
    const userBook = await prisma.userBook.findUnique({
      where: { id: userBookId },
      include: {
        book: true,
        bookstore: {
          select: { id: true, ownerId: true },
        },
      },
    });

    if (!userBook) {
      return NextResponse.json(
        { message: '本が見つかりませんでした。' },
        { status: 404 },
      );
    }

    // 2. マルチテナント隔離：他人のデータへのアクセスを拒否
    if (userBook.bookstore.ownerId !== currentUser.id) {
      return NextResponse.json(
        { message: 'この本にアクセスする権限がありません。' },
        { status: 403 },
      );
    }

    // 3. Book 側のタイトル・著者・画像URL を更新（あれば）
    const bookData: {
      title?: string;
      author?: string;
      imageUrl?: string | null;
    } = {};
    if (typeof title === 'string' && title.trim()) bookData.title = title.trim();
    if (typeof author === 'string' && author.trim()) bookData.author = author.trim();
    if (typeof imageUrl === 'string') {
      const trimmed = imageUrl.trim();
      bookData.imageUrl = trimmed || null;
    } else if (imageUrl === null) {
      bookData.imageUrl = null;
    }

    if (Object.keys(bookData).length > 0) {
      await prisma.book.update({
        where: { id: userBook.bookId },
        data: bookData,
      });
    }

    // 4. UserBook 側のコメント・公開フラグを更新
    const userBookData: {
      comment?: string | null;
      isPublic?: boolean;
    } = {};
    if (typeof comment === 'string') {
      const trimmed = comment.trim();
      userBookData.comment = trimmed || null;
    } else if (comment === null) {
      userBookData.comment = null;
    }
    if (typeof isPublic === 'boolean') userBookData.isPublic = isPublic;

    const updated = await prisma.userBook.update({
      where: { id: userBookId },
      data: userBookData,
      include: { book: true },
    });

    return NextResponse.json({ userBook: updated }, { status: 200 });
  } catch (err) {
    console.error('PATCH /api/user-books/[userBookId] error', err);
    return NextResponse.json(
      { message: '更新に失敗しました。' },
      { status: 500 },
    );
  }
}

// DELETE: 本棚から削除（Book 自体は残す）
export async function DELETE(_req: Request, ctx: RouteContext) {
  try {
    // 認証チェック
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { message: '認証が必要です。' },
        { status: 401 },
      );
    }

    const userBookId = await getUserBookId(ctx.params);

    if (!userBookId) {
      return NextResponse.json(
        { message: 'userBookId is required' },
        { status: 400 },
      );
    }

    // 削除前に書店IDを取得
    const userBook = await prisma.userBook.findUnique({
      where: { id: userBookId },
      include: {
        bookstore: {
          select: { id: true, ownerId: true },
        },
      },
    });

    if (!userBook) {
      return NextResponse.json(
        { message: '本が見つかりませんでした。' },
        { status: 404 },
      );
    }

    // マルチテナント隔離：他人のデータへのアクセスを拒否
    if (userBook.bookstore.ownerId !== currentUser.id) {
      return NextResponse.json(
        { message: 'この本にアクセスする権限がありません。' },
        { status: 403 },
      );
    }

    const bookstoreId = userBook.bookstore.id;

    // 削除実行
    await prisma.userBook.delete({
      where: { id: userBookId },
    });

    // 残りを 1,2,3... に詰め直す
    const rest = await prisma.userBook.findMany({
      where: { bookstoreId },
      orderBy: { sortOrder: 'asc' },
    });

    if (rest.length > 0) {
      await prisma.$transaction(
        rest.map((ub, index) =>
          prisma.userBook.update({
            where: { id: ub.id },
            data: { sortOrder: index + 1 },
          }),
        ),
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('DELETE /api/user-books/[userBookId] error', err);
    return NextResponse.json(
      { message: '削除に失敗しました。' },
      { status: 500 },
    );
  }
}
