// lib/currentUser.ts
import { auth } from '@clerk/nextjs/server';
import { prisma } from './prisma';

/**
 * Clerk認証から現在のユーザーを取得
 * clerkIdでユーザーを検索し、存在しなければ作成する
 */
export async function getCurrentUser() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  // clerkIdでユーザーを検索
  let user = await prisma.user.findUnique({
    where: { clerkId },
  });

  // ユーザーが存在しない場合は作成
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        // handleは後で設定される
      },
    });
  }

  return user;
}
