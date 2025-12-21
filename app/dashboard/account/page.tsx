// app/dashboard/account/page.tsx
import { getCurrentUser } from '@/lib/currentUser';
import { prisma } from '@/lib/prisma';
import AccountSettingsForm from './AccountSettingsForm';
import { redirect } from 'next/navigation';

export default async function AccountPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/');
  }

  // ユーザー情報を取得
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      id: true,
      amazonAssociateTag: true,
      isPro: true,
    },
  });

  if (!user) {
    redirect('/');
  }

  return (
    <main style={{ padding: '32px 24px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        アカウント設定
      </h1>
      <AccountSettingsForm user={user} />
    </main>
  );
}

