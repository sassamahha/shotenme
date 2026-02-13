'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { UserBook, Book } from '@prisma/client';

type UserBookWithBook = UserBook & { book: Book };

type Props = {
  userBook: UserBookWithBook;
  affiliateTag: string;
  theme?: string | null;
};

export default function BookCard({ userBook, affiliateTag, theme }: Props) {
  const b = userBook.book;

  // imageUrl が有効なHTTP(S) URLかチェック
  const hasValidImage =
    b.imageUrl &&
    b.imageUrl.trim().length > 0 &&
    (b.imageUrl.startsWith('http://') || b.imageUrl.startsWith('https://'));

  const hasComment = !!userBook.comment && userBook.comment.trim().length > 0;

  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ★ 共通で使う Amazon リンク
  const amazonUrl = `https://www.amazon.co.jp/dp/${b.asin}?tag=${affiliateTag}`;

  // 推薦文の1行目を抽出（30-40文字で切り詰め）
  const getFirstLine = (comment: string | null): string | null => {
    if (!comment || comment.trim().length === 0) return null;
    const firstLine = comment.split('\n')[0].trim();
    if (firstLine.length === 0) return null;
    // 35文字で切り詰め（30-40文字の中央値）
    return firstLine.length > 35 ? firstLine.slice(0, 35) + '...' : firstLine;
  };

  const firstLine = getFirstLine(userBook.comment);
  const hasFirstLine = !!firstLine;

  // テーマカラーに基づく帯の背景色
  const getObiBackgroundColor = (theme?: string | null): string => {
    switch (theme) {
      case 'warm':
        return '#fef3e2'; // 薄いオレンジ系
      case 'paper':
        return '#fdfaf3'; // オフホワイト
      default:
        return '#f3f4f6'; // デフォルト：薄いグレー
    }
  };

  const obiBackgroundColor = getObiBackgroundColor(theme);

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
        {/* カバー画像と帯 */}
        <div
          style={{
            position: 'relative',
            width: '100%',
          }}
        >
          {/* カバー画像 */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingTop: '150%', // 2:3 の縦長
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
          </div>

          {/* 帯（推薦文の1行目）- 書影の下部に被さる形で配置 */}
          {hasFirstLine && (
            <div
              onClick={() => setOpen(true)}
              style={{
                marginTop: '-40px', // 書影に被さる（ネガティブマージン）
                position: 'relative',
                zIndex: 1, // 書影より前面に
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.7)', // 半透明白
                backdropFilter: 'blur(2px)', // すりガラス効果
                fontSize: 12,
                lineHeight: 1.4,
                color: '#374151',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)', // 上方向に薄い影
                borderTop: '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              {firstLine}
            </div>
          )}
        </div>

        {/* 本文 */}
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
            <p
              style={{
                fontSize: 12,
                color: '#6b7280',
                marginBottom: 8,
              }}
            >
              {b.author}
            </p>
          )}

          {/* ボタン行 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              marginTop: 12,
            }}
          >
            {hasComment && (
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
                推薦文
              </button>
            )}

            <Link
              href={amazonUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 10px',
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
      </article>

      {/* 推薦文モーダル */}
      {open && hasComment && (
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
              『{b.title}』推薦文
            </h3>

            <p
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: '#374151',
                whiteSpace: 'pre-wrap',
                marginBottom: 16,
              }}
            >
              {userBook.comment}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
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
                rel="noopener noreferrer"
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
