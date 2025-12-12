// app/api/settings/profile/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/currentUser';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const {
      handle,
      displayName,
      bookstoreTitle,
      theme,
      bio,
      amazonAssociateTag,
    } = body as {
      handle: string;
      displayName?: string | null;
      bookstoreTitle?: string | null;
      theme?: string;
      bio?: string | null;
      amazonAssociateTag?: string | null;
    };

    // 現在のユーザーを取得
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: '認証が必要です。' },
        { status: 401 },
      );
    }

    // ハンドル重複チェック（自分以外に同じ handle がいないか）
    if (handle) {
      const exists = await prisma.user.findFirst({
        where: {
          handle,
          id: { not: currentUser.id },
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

    // アフィタグは Pro ユーザーだけ反映。それ以外は null 固定。
    let affiliateTagForUpdate: string | null | undefined;
    if (typeof amazonAssociateTag !== 'undefined') {
      affiliateTagForUpdate = currentUser.isPro
        ? (amazonAssociateTag?.trim() || null)
        : null;
    }

    const updated = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        handle,
        displayName,
        bookstoreTitle,
        theme: theme ?? 'default',
        bio: bioForDb,
        ...(typeof affiliateTagForUpdate !== 'undefined'
          ? { amazonAssociateTag: affiliateTagForUpdate }
          : {}),
      },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error('PATCH /api/settings/profile error', err);
    return NextResponse.json(
      { error: 'プロフィールの更新に失敗しました。' },
      { status: 500 },
    );
  }
}
