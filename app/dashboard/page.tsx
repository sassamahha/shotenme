// app/dashboard/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getCurrentBookstore } from '@/lib/currentUser';
import UserBookTable from './UserBookTable';
import MenuButtons from './MenuButtons';
import { redirect } from 'next/navigation';

type PageProps = {
  searchParams: Promise<{ bookstore?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const bookstoreId = params.bookstore;

  // 「現在のユーザー」を共通ヘルパーから取得
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

  // ユーザーの書店一覧を取得
  const bookstores = await prisma.bookstore.findMany({
    where: { ownerId: currentUser.id },
    orderBy: { createdAt: 'asc' },
  });

  // 書店が1つもない場合は書店作成を促す
  if (bookstores.length === 0) {
    return (
      <main style={{ padding: '32px 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          書店を作成してください
        </h1>
        <p style={{ marginBottom: 16, color: '#6b7280' }}>
          最初の書店を作成して、本を追加しましょう。
        </p>
        <Link
          href="/dashboard/bookstores/new"
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
          書店を作成する
        </Link>
      </main>
    );
  }

  // bookstoreIdが指定されていない場合は最初の書店にリダイレクト
  if (!bookstoreId) {
    redirect(`/dashboard?bookstore=${bookstores[0].id}`);
  }

  // 指定された書店を取得（所有者チェック含む）
  const bookstore = await getCurrentBookstore(bookstoreId);

  if (!bookstore) {
    // 書店が見つからない、または所有者でない場合は最初の書店にリダイレクト
    redirect(`/dashboard?bookstore=${bookstores[0].id}`);
  }

  // クライアント側テーブルに渡すために必要な情報だけ整形
  const userBooks = bookstore.books.map((ub) => ({
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
    <main style={{ padding: '24px 20px' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
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
            {bookstore.bookstoreTitle || '本屋名'}｜書棚
          </h1>
          <div style={{ fontSize: 14, color: '#6b7280' }}>
            <p style={{ margin: 0, marginBottom: 2 }}>
              書店ID: @{bookstore.handle ?? 'yourname'}
            </p>
            <p style={{ margin: 0 }}>
              店長: {bookstore.displayName ?? '店長の名前'}
            </p>
          </div>
        </div>

        <MenuButtons handle={bookstore.handle} bookstoreId={bookstore.id} />
      </header>

      {userBooks.length === 0 ? (
        <p style={{ color: '#6b7280' }}>まだ本が登録されていません。</p>
      ) : (
        <>
          <UserBookTable userBooks={userBooks} bookstoreId={bookstore.id} />
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 16, lineHeight: 1.6 }}>
            <p style={{ margin: 0, marginBottom: 4 }}>
             ・ISBNの登録で画像を取得できない場合は、画像のURLをコピペ入力します。
            </p>
            <p style={{ margin: 0 }}>
             ・カテゴリページなどASIN以外のページをリンク先にする場合は、「AmazonのURLを登録」から入力します。
            </p>
          </div>
        </>
      )}
    </main>
  );
}
