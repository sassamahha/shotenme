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

// bio 内の URL を自動でリンク化し、改行を処理
function linkifyBio(text: string): ReactNode {
  // まず改行で分割
  const lines = text.split('\n');
  
  return lines.map((line, lineIdx) => {
    // 各行内のURLをリンク化
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const parts = line.split(urlPattern);
    
    const lineContent = parts.map((part, partIdx) => {
      if (/^https?:\/\//.test(part)) {
        return (
          <a
            key={`${lineIdx}-${partIdx}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2563eb', textDecoration: 'underline' }}
          >
            {part}
          </a>
        );
      }
      return <span key={`${lineIdx}-${partIdx}`}>{part}</span>;
    });
    
    return (
      <span key={lineIdx}>
        {lineContent}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    );
  });
}

export default async function UserStorePage({ params }: PageProps) {
  const { handle } = await params;

  const bookstore = await prisma.bookstore.findUnique({
    where: { handle },
    include: {
      owner: {
        select: {
          amazonAssociateTag: true,
        },
      },
      books: {
        where: { isPublic: true },
        orderBy: { sortOrder: 'asc' },
        include: { book: true },
      },
    },
  });

  if (!bookstore) {
    return (
      <main style={{ padding: '40px' }}>
        <p>この本屋は見つかりませんでした。</p>
      </main>
    );
  }

  const title = bookstore.bookstoreTitle || `@${bookstore.handle} の本屋`;
  const bg = resolveBackground(bookstore.theme);

  // ★ アフィリエイトタグを決定（ownerのamazonAssociateTagが設定されていれば優先、それ以外は共通タグ）
  // 全書店共通のアフィリエイトタグ
  const affiliateTag = bookstore.owner.amazonAssociateTag || 'shotenme-22';

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
            店長：{bookstore.displayName ?? ''}
          </p>
          {bookstore.bio && (
            <p
              style={{
                marginTop: 12,
                fontSize: 13,
                color: '#4b5563',
                maxWidth: 640,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {linkifyBio(bookstore.bio)}
            </p>
          )}
        </header>

        {/* 本カード一覧（スマホ2 / PC4 カラム） */}
        {bookstore.books.length === 0 ? (
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            まだ公開している本がありません。
          </p>
        ) : (
          <section className="book-grid">
            {bookstore.books.map((ub) => (
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
