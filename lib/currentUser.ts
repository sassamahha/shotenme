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
      },
    });
  }

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
