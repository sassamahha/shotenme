'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { UserBook, Book } from '@prisma/client';

type UserBookWithBook = UserBook & { book: Book };

type Props = {
  userBook: UserBookWithBook;
  amazonUrl: string;
  rakutenUrl: string | null;
  theme?: string | null;
};

const buyButtonBase: React.CSSProperties = {
  width: '100%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 10px',
  borderRadius: 999,
  fontWeight: 600,
  fontSize: 13,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

export default function BookCard({ userBook, amazonUrl, rakutenUrl, theme }: Props) {
  const b = userBook.book;

  const hasValidImage =
    b.imageUrl &&
    b.imageUrl.trim().length > 0 &&
    (b.imageUrl.startsWith('http://') || b.imageUrl.startsWith('https://'));

  // 帯 = obi（1行）/ ノート = note（長文・任意）
  const obi = userBook.obi?.trim() || null;
  const note = userBook.note?.trim() || null;
  const hasNote = !!note;

  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <>
      <article
        style={{
          borderRadius: 0,
          overflow: 'hidden',
          background: '#ffffff',
          boxShadow:
            '0 18px 45px rgba(15,23,42,0.10), 0 0 0 1px rgba(148,163,184,0.18)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ position: 'relative', width: '100%' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingTop: '150%',
              background: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {hasValidImage && !imageError && b.imageUrl ? (
              <Image
                src={b.imageUrl}
                alt={b.title}
                fill
                sizes="(min-width: 1024px) 260px, 80vw"
                style={{ objectFit: 'cover' }}
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: 14,
                  textAlign: 'center',
                  padding: '16px',
                }}
              >
                表紙画像なし
              </div>
            )}
            {/* 帯（obi）= 書影の下部に薄く被さる半透明帯（すりガラス）。書影を活かす */}
            {obi && (
              <div
                onClick={() => hasNote && setOpen(true)}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '20%',
                  background: 'rgba(255, 255, 255, 0.72)',
                  backdropFilter: 'blur(3px)',
                  WebkitBackdropFilter: 'blur(3px)',
                  borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 12px',
                  cursor: hasNote ? 'pointer' : 'default',
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#1f2937',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {obi}
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '16px 18px 18px' }}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 4,
              color: '#111827',
            }}
          >
            {b.title}
          </h2>

          {b.author && (
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
              {b.author}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              marginTop: 12,
            }}
          >
            {hasNote && (
              <button
                type="button"
                onClick={() => setOpen(true)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 999,
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                推薦文を読む
              </button>
            )}

            {rakutenUrl && (
              <Link
                href={rakutenUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                style={{ ...buyButtonBase, background: '#bf0000', color: '#fff' }}
              >
                楽天で見る
              </Link>
            )}

            <Link
              href={amazonUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              style={{ ...buyButtonBase, background: '#fbbf24', color: '#1f2937' }}
            >
              Amazonで見る
            </Link>
          </div>
        </div>
      </article>

      {/* ノートモーダル */}
      {open && hasNote && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 560,
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              borderRadius: 20,
              background: '#ffffff',
              padding: '20px 22px 18px',
              boxShadow:
                '0 24px 55px rgba(15,23,42,0.4), 0 0 0 1px rgba(148,163,184,0.35)',
            }}
          >
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 8,
                color: '#111827',
              }}
            >
              『{b.title}』
            </h3>

            {obi && (
              <p
                style={{
                  fontSize: 13,
                  color: '#6b7280',
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                {obi}
              </p>
            )}

            <p
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: '#374151',
                whiteSpace: 'pre-wrap',
                marginBottom: 16,
              }}
            >
              {note}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                閉じる
              </button>

              <Link
                href={amazonUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: '#fbbf24',
                  color: '#1f2937',
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Amazonで見る
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
