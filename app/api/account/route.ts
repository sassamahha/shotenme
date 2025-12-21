// app/api/account/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/currentUser';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { amazonAssociateTag } = body as {
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
        ...(typeof affiliateTagForUpdate !== 'undefined'
          ? { amazonAssociateTag: affiliateTagForUpdate }
          : {}),
      },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error('PATCH /api/account error', err);
    return NextResponse.json(
      { error: 'アカウント設定の更新に失敗しました。' },
      { status: 500 },
    );
  }
}

