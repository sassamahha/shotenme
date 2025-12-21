// app/api/bookstores/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/currentUser';

// ユーザーの書店一覧を取得
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: '認証が必要です。' },
        { status: 401 },
      );
    }

    const bookstores = await prisma.bookstore.findMany({
      where: { ownerId: currentUser.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        handle: true,
        bookstoreTitle: true,
        displayName: true,
        theme: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ bookstores });
  } catch (err) {
    console.error('GET /api/bookstores error', err);
    return NextResponse.json(
      { error: '書店一覧の取得に失敗しました。' },
      { status: 500 },
    );
  }
}

// 新しい書店を作成
export async function POST(req: NextRequest) {
  try {
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

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: '認証が必要です。' },
        { status: 401 },
      );
    }

    // handleの重複チェック
    if (handle) {
      const exists = await prisma.bookstore.findUnique({
        where: { handle },
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

    const bookstore = await prisma.bookstore.create({
      data: {
        ownerId: currentUser.id,
        handle: handle || null,
        bookstoreTitle: bookstoreTitle || null,
        displayName: displayName || null,
        theme: theme || 'default',
        bio: bioForDb,
      },
    });

    return NextResponse.json({ bookstore }, { status: 201 });
  } catch (err) {
    console.error('POST /api/bookstores error', err);
    return NextResponse.json(
      { error: '書店の作成に失敗しました。' },
      { status: 500 },
    );
  }
}
