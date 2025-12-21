import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/currentUser';
import Sidebar from './Sidebar';
import { redirect } from 'next/navigation';

type Props = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: Props) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/');
  }

  // ユーザーの書店一覧を取得
  const bookstores = await prisma.bookstore.findMany({
    where: { ownerId: currentUser.id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      handle: true,
      bookstoreTitle: true,
    },
  });

  return (
    <div className="dashboard-layout-container" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* サイドバー */}
      <Sidebar bookstores={bookstores} currentBookstoreId={null} />

      {/* メインコンテンツ */}
      <div className="dashboard-main-content">
        {children}
      </div>
    </div>
  );
}
