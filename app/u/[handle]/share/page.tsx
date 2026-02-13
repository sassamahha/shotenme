import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

const DEFAULT_PATTERN = 'library-card';

type PageProps = {
  params: Promise<{ handle: string }>;
};

export default async function ShareImagePage({ params }: PageProps) {
  const { handle } = await params;

  const bookstore = await prisma.bookstore.findUnique({
    where: { handle },
  });

  if (!bookstore) {
    notFound();
  }

  const imageUrl = `/api/share/${handle}/${DEFAULT_PATTERN}`;
  const downloadFilename = `shoten-card-${handle}.png`;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f3f4f6',
        padding: '24px 20px 48px',
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Link
            href={`/@${handle}`}
            style={{
              fontSize: 14,
              color: '#6b7280',
              textDecoration: 'none',
            }}
          >
            ← 書店ページへ
          </Link>
        </div>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 16,
            color: '#111827',
          }}
        >
          シェア用画像
        </h1>
        <p
          style={{
            fontSize: 14,
            color: '#6b7280',
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          SNS やメッセージで使える画像です。画像を長押しするか、下のボタンから保存できます。
        </p>
        <div
          style={{
            marginBottom: 24,
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            background: '#fff',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${bookstore.bookstoreTitle ?? handle} のシェア用カード`}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
        </div>
        <a
          href={imageUrl}
          download={downloadFilename}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 20px',
            borderRadius: 999,
            background: '#111827',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          画像をダウンロード
        </a>
      </div>
    </main>
  );
}
