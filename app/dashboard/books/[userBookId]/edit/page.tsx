// app/dashboard/books/[userBookId]/edit/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import EditBookForm from './EditBookForm';

type PageProps =
  | { params: { userBookId: string } }
  | { params: Promise<{ userBookId: string }> };

async function resolveParams(params: PageProps['params']) {
  return params instanceof Promise ? await params : params;
}

export default async function EditBookPage({ params }: PageProps) {
  const { userBookId } = await resolveParams(params);

  if (!userBookId) {
    return (
      <main style={{ padding: '32px 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          本の情報を編集する
        </h1>
        <p>URL パラメータに userBookId がありません。</p>
        <Link href="/dashboard" style={{ marginTop: 16, display: 'inline-block' }}>
          戻る
        </Link>
      </main>
    );
  }

  const userBook = await prisma.userBook.findUnique({
    where: { id: userBookId },
    include: { book: true, bookstore: true },
  });

  if (!userBook) {
    return (
      <main style={{ padding: '32px 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          本の情報を編集する
        </h1>
        <p>指定された本が見つかりませんでした。</p>
        <Link href="/dashboard" style={{ marginTop: 16, display: 'inline-block' }}>
          戻る
        </Link>
      </main>
    );
  }

  const { book } = userBook;
  const bookstoreId = userBook.bookstore.id;

  return (
    <main style={{ padding: '32px 24px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        本の情報を編集する
      </h1>
      <Link
          href={`/dashboard?bookstore=${bookstoreId}`}
          style={{
            margin: '16px 0px',
            padding: '10px 16px',
            borderRadius: 999,
            border: '1px solid #d1d5db',
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          戻る
        </Link>

      <EditBookForm
        userBookId={userBookId}
        bookstoreId={bookstoreId}
        initial={{
          title: book.title,
          author: book.author ?? '',
          asin: book.asin,
          imageUrl: book.imageUrl ?? '',
          comment: userBook.comment ?? '',
          isPublic: userBook.isPublic,
        }}
      />

    </main>
  );
}
