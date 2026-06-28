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

  // 初回ログイン時に複数の Server Component が並行で呼んでも衝突しないよう upsert で冪等化
  // （find→create だと競合して P2002: clerkId unique violation が起きる）
  const user = await prisma.user.upsert({
    where: { clerkId },
    update: {},
    create: { clerkId },
  });

  return user;
}

/**
 * 書店を取得し、所有者であることを確認
 * @param bookstoreId 書店ID
 * @returns 書店情報（所有者でない場合はnull）
 */
export async function getCurrentBookstore(bookstoreId: string) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    return null;
  }

  const bookstore = await prisma.bookstore.findFirst({
    where: {
      id: bookstoreId,
      ownerId: currentUser.id,
    },
    include: {
      books: {
        orderBy: { sortOrder: 'asc' },
        include: { book: true },
      },
    },
  });

  return bookstore;
}
