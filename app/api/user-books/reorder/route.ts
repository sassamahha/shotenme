// app/api/user-books/reorder/route.ts
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/currentUser';

export async function PATCH(req: Request) {
  const { userBookIds } = await req.json();

  if (!Array.isArray(userBookIds)) {
    return NextResponse.json(
      { message: 'userBookIds は配列で送ってください。' },
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

  // マルチテナント隔離：指定されたすべてのuserBookIdsが現在のユーザーのものかチェック
  const userBooks = await prisma.userBook.findMany({
    where: {
      id: { in: userBookIds },
    },
    select: { id: true, userId: true },
  });

  // 指定されたIDの数と取得できた数が一致しない場合（存在しないIDが含まれている）
  if (userBooks.length !== userBookIds.length) {
    return NextResponse.json(
      { message: '一部の本が見つかりませんでした。' },
      { status: 404 },
    );
  }

  // 1つでも他人のデータが含まれていれば拒否
  const hasOtherUserData = userBooks.some((ub) => ub.userId !== user.id);
  if (hasOtherUserData) {
    return NextResponse.json(
      { message: 'この操作を実行する権限がありません。' },
      { status: 403 },
    );
  }

  // 指定された順番どおりに 1,2,3... を振り直す
  await prisma.$transaction(
    userBookIds.map((id: string, index: number) =>
      prisma.userBook.update({
        where: { id, userId: user.id }, // userIdも条件に含める（二重チェック）
        data: { sortOrder: index + 1 },
      }),
    ),
  );

  // 公開ページのキャッシュをクリア（handleが設定されている場合）
  if (user.handle) {
    revalidatePath(`/u/${user.handle}`);
    revalidatePath(`/@${user.handle}`);
  }

  return NextResponse.json({ ok: true });
}