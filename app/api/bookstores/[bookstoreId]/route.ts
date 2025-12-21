// app/api/bookstores/[bookstoreId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentBookstore } from '@/lib/currentUser';

type RouteContext = {
  params: Promise<{ bookstoreId: string }>;
};

async function getBookstoreId(params: RouteContext['params']): Promise<string> {
  const resolved = await params;
  return resolved.bookstoreId;
}

// 書店を更新
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const bookstoreId = await getBookstoreId(ctx.params);
    const body = await req.json();

    const {
      handle,
      bookstoreTitle,
      displayName,
      theme,
      bio,
    } = body as {
      handle?: string;
      bookstoreTitle?: string | null;
      displayName?: string | null;
      theme?: string;
      bio?: string | null;
    };

    // 書店を取得（所有者チェック含む）
    const bookstore = await getCurrentBookstore(bookstoreId);

    if (!bookstore) {
      return NextResponse.json(
        { error: '書店が見つかりません。' },
        { status: 404 },
      );
    }

    // handleの重複チェック（自分以外に同じ handle がいないか）
    if (handle && handle !== bookstore.handle) {
      const exists = await prisma.bookstore.findFirst({
        where: {
          handle,
          id: { not: bookstoreId },
        },
        select: { id: true },
      });

      if (exists) {
        return NextResponse.json(
          { error: 'その書店IDはすでに使われています。' },
          { status: 400 },
        );
      }
    }

    // bio は 140 文字でトリム
    const bioForDb =
      bio && bio.trim().length > 0 ? bio.trim().slice(0, 140) : null;

    const updated = await prisma.bookstore.update({
      where: { id: bookstoreId },
      data: {
        ...(handle !== undefined ? { handle: handle || null } : {}),
        ...(bookstoreTitle !== undefined
          ? { bookstoreTitle: bookstoreTitle || null }
          : {}),
        ...(displayName !== undefined
          ? { displayName: displayName || null }
          : {}),
        ...(theme !== undefined ? { theme: theme || 'default' } : {}),
        ...(bio !== undefined ? { bio: bioForDb } : {}),
      },
    });

    return NextResponse.json({ bookstore: updated });
  } catch (err) {
    console.error('PATCH /api/bookstores/[bookstoreId] error', err);
    return NextResponse.json(
      { error: '書店の更新に失敗しました。' },
      { status: 500 },
    );
  }
}

// 書店を削除
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const bookstoreId = await getBookstoreId(ctx.params);

    // 書店を取得（所有者チェック含む）
    const bookstore = await getCurrentBookstore(bookstoreId);

    if (!bookstore) {
      return NextResponse.json(
        { error: '書店が見つかりません。' },
        { status: 404 },
      );
    }

    // 書店を削除（CascadeでUserBookも削除される）
    await prisma.bookstore.delete({
      where: { id: bookstoreId },
    });

    return NextResponse.json({ message: '書店を削除しました。' });
  } catch (err) {
    console.error('DELETE /api/bookstores/[bookstoreId] error', err);
    return NextResponse.json(
      { error: '書店の削除に失敗しました。' },
      { status: 500 },
    );
  }
}
