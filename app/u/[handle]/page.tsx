// app/u/[handle]/page.tsx
import { prisma } from '@/lib/prisma';
import BookCard from './BookCard';
import type { ReactNode } from 'react';

type PageProps = {
  // Next 16: params は Promise で渡ってくる
  params: Promise<{ handle: string }>;
};

function resolveBackground(theme?: string | null): string {
  switch (theme) {
    case 'warm':
      return 'linear-gradient(135deg,#f97316,#facc15)'; // あたたかいグラデーション
    case 'paper':
      return '#fdfaf3'; // 紙っぽいオフホワイト
    default:
      return '#f3f4f6'; // デフォルト：薄いグレー
  }
}

// bio 内の URL を自動でリンク化
function linkifyBio(text: string): ReactNode {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlPattern);

  return parts.map((part, idx) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#2563eb', textDecoration: 'underline' }}
        >
          {part}
        </a>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export default async function UserStorePage({ params }: PageProps) {
  const { handle } = await params;

  const user = await prisma.user.findUnique({
    where: { handle },
    include: {
      books: {
        where: { isPublic: true },
        orderBy: { sortOrder: 'asc' },
        include: { book: true },
      },
    },
  });

  if (!user) {
    return (
      <main style={{ padding: '40px' }}>
        <p>この本屋は見つかりませんでした。</p>
      </main>
    );
  }

  const title = user.bookstoreTitle || `@${user.handle} の本屋`;
  const bg = resolveBackground(user.theme);

  // ★ アフィリエイトタグを決定（amazonAssociateTagが設定されていれば優先、それ以外は共通タグ）
  // テスト用：isProに関係なく、amazonAssociateTagが設定されていれば使用
  const affiliateTag = user.amazonAssociateTag || 'shotenme-22';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: bg,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '32px 24px 48px',
          color: '#111827',
        }}
      >
        {/* ヘッダー */}
        <header style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            店長：{user.displayName ?? ''}
          </p>
          {user.bio && (
            <p
              style={{
                marginTop: 12,
                fontSize: 13,
                color: '#4b5563',
                maxWidth: 640,
                lineHeight: 1.6,
              }}
            >
              {linkifyBio(user.bio)}
            </p>
          )}
        </header>

        {/* 本カード一覧（スマホ2 / PC4 カラム） */}
        {user.books.length === 0 ? (
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            まだ公開している本がありません。
          </p>
        ) : (
          <section className="book-grid">
            {user.books.map((ub) => (
              <BookCard
                key={ub.id}
                userBook={ub}
                affiliateTag={affiliateTag} 
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
