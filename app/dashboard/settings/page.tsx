// app/dashboard/settings/page.tsx
import { getCurrentUser } from '@/lib/currentUser';
import AccountSettingsForm from './AccountSettingsForm';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main style={{ padding: '32px 24px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          アカウント設定
        </h1>
        <p>ユーザーが見つかりませんでした。</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '32px 24px', maxWidth: 640 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        アカウント設定
      </h1>
      {!user.handle && (
        <div
          style={{
            padding: '16px',
            marginBottom: 24,
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: 8,
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            書店IDを設定してください
          </p>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            公開ページを表示するには、書店ID（@username）の設定が必要です。
          </p>
        </div>
      )}
      <AccountSettingsForm user={user} />
    </main>
  );
}
