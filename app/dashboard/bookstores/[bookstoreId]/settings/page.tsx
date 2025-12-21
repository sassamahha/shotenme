// app/dashboard/bookstores/[bookstoreId]/settings/page.tsx
import { getCurrentBookstore } from '@/lib/currentUser';
import BookstoreSettingsForm from './BookstoreSettingsForm';
import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ bookstoreId: string }>;
};

async function resolveParams(params: PageProps['params']) {
  return await params;
}

export default async function BookstoreSettingsPage({
  params,
}: PageProps) {
  const { bookstoreId } = await resolveParams(params);

  const bookstore = await getCurrentBookstore(bookstoreId);

  if (!bookstore) {
    redirect('/dashboard');
  }

  return (
    <main style={{ padding: '32px 24px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        書店設定
      </h1>
      <BookstoreSettingsForm bookstore={bookstore} />
    </main>
  );
}
