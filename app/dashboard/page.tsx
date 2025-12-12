// app/dashboard/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/currentUser';
import UserBookTable from './UserBookTable';

export default async function DashboardPage() {
  // 「現在のユーザー」を共通ヘルパーから取得（SaaS 化したらここだけ差し替え）
  const currentUser = await getCurrentUser();

  // まだユーザーが1件も作られていないケース
  if (!currentUser) {
    return (
      <main style={{ padding: '32px 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          本屋名｜書棚
        </h1>
        <p style={{ marginBottom: 16 }}>まだユーザーが作成されていません。</p>
        <Link
          href="/dashboard/books/new"
          style={{
            display: 'inline-block',
            padding: '10px 18px',
            borderRadius: 999,
            background: '#22c55e',
            color: '#064e3b',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          最初の本を追加する
        </Link>
      </main>
    );
  }

  // 本棚付きでユーザーを再取得（将来は include を getCurrentUser 側に寄せてもOK）
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    include: {
      books: {
        orderBy: { sortOrder: 'asc' },
        include: { book: true },
      },
    },
  });

  if (!user) {
    // 理論上ここには来ないけど保険で
    return (
      <main style={{ padding: '32px 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          本屋名｜書棚
        </h1>
        <p style={{ marginBottom: 16, color: '#ef4444' }}>
          ユーザー情報の取得に失敗しました。
        </p>
      </main>
    );
  }

  // handle未設定の場合は設定画面へ誘導
  if (!user.handle) {
    return (
      <main style={{ padding: '32px 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          {user.bookstoreTitle || '本屋名'}｜書棚
        </h1>
        <div
          style={{
            padding: '24px',
            marginBottom: 24,
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: 8,
          }}
        >
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            書店IDを設定してください
          </p>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
            公開ページを表示するには、書店ID（@username）の設定が必要です。
          </p>
          <Link
            href="/dashboard/settings"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              borderRadius: 999,
              background: '#10b981',
              color: '#022c22',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            アカウント設定へ
          </Link>
        </div>
      </main>
    );
  }

  // クライアント側テーブルに渡すために必要な情報だけ整形
  const userBooks = user.books.map((ub) => ({
    id: ub.id,
    sortOrder: ub.sortOrder,
    comment: ub.comment,
    isPublic: ub.isPublic,
    book: {
      id: ub.book.id,
      asin: ub.book.asin,
      title: ub.book.title,
    },
  }));

  return (
    <main style={{ padding: '32px 24px' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {user.bookstoreTitle || '本屋名'}｜書棚
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            書店ID : @{user.handle ?? 'yourname'} | 店長 : {user.displayName ?? '店長の名前'}
          </p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
            ※ タイトルが ASIN と同じ本は「（タイトル未取得）」として表示されます。
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href="/dashboard/settings"
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid #d1d5db',
              fontSize: 14,
              textDecoration: 'none',
              color: '#111827',
              background: '#fff',
            }}
          >
            アカウント設定
          </Link>
          <Link
            href={`/@${user.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid #d1d5db',
              fontSize: 14,
              textDecoration: 'none',
              color: '#111827',
              background: '#fff',
            }}
          >
            公開ページを見る
          </Link>
          <Link
            href="/dashboard/books/new"
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              background: '#10b981',
              color: '#022c22',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            本を追加する
          </Link>
        </div>
      </header>

      {userBooks.length === 0 ? (
        <p style={{ color: '#6b7280' }}>まだ本が登録されていません。</p>
      ) : (
        <UserBookTable userBooks={userBooks} />
      )}
    </main>
  );
}
