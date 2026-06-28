// app/maintenance/page.tsx
// リビルド中の「準備中」画面。noindex。
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '準備中 | Shoten.me',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        color: '#111827',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        Shoten.me は準備中です
      </h1>
      <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.8, maxWidth: 360 }}>
        いま店構えを作り直しています。
        <br />
        もう少しだけお待ちください。
      </p>
    </main>
  );
}
