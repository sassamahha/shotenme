// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// 環境変数の確認とエラーメッセージ
if (!process.env.DATABASE_URL) {
  const errorMessage =
    '❌ DATABASE_URL is not set. Please check your .env.local file.\n' +
    '   Make sure .env.local exists in the project root and contains:\n' +
    '   DATABASE_URL="postgresql://..."';
  console.error(errorMessage);
  throw new Error(errorMessage);
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Supabaseプーラー接続用の設定
// ?pgbouncer=true が含まれている場合は、接続プール設定を調整
const isPooler = process.env.DATABASE_URL?.includes('pooler') || 
                 process.env.DATABASE_URL?.includes('pgbouncer=true');

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // プーラー接続の場合、接続プールの設定を調整
    ...(isPooler && {
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    }),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
