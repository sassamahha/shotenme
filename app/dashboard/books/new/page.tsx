// app/dashboard/books/new/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Mode = 'isbn' | 'asin' | 'url';

export default function NewBookPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('isbn');
  const [isbn, setIsbn] = useState('');
  const [asin, setAsin] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        isbn: mode === 'isbn' ? isbn : undefined,
        asin: mode === 'asin' ? asin : undefined,
        url: mode === 'url' ? url : undefined,
        title: mode === 'isbn' ? undefined : title || undefined,
        author: mode === 'isbn' ? undefined : author || undefined,
        imageUrl: imageUrl || undefined,
        comment: comment || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        data?.message ||
          '登録に失敗しました。時間をおいて再度お試しください。',
      );
      setSubmitting(false);
      return;
    }

    // 成功
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <main style={{ padding: '32px 24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        本を追加する
      </h1>

      {/* モード切り替え */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          fontSize: 14,
        }}
      >
        <button
          type="button"
          onClick={() => setMode('isbn')}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid #d1d5db',
            background: mode === 'isbn' ? '#111827' : '#fff',
            color: mode === 'isbn' ? '#fff' : '#111827',
            cursor: 'pointer',
          }}
        >
          ISBN で登録
        </button>
        <button
          type="button"
          onClick={() => setMode('asin')}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid #d1d5db',
            background: mode === 'asin' ? '#111827' : '#fff',
            color: mode === 'asin' ? '#fff' : '#111827',
            cursor: 'pointer',
          }}
        >
          ASIN で登録
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid #d1d5db',
            background: mode === 'url' ? '#111827' : '#fff',
            color: mode === 'url' ? '#fff' : '#111827',
            cursor: 'pointer',
          }}
        >
          Amazon の URL で登録
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          fontSize: 14,
        }}
      >
        {mode === 'isbn' && (
          <>
            <div>
              <label
                style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}
              >
                ISBN
              </label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="例: 9784575248524"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                }}
                required
              />
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                ISBN からタイトル・著者・カバー画像を自動取得します。
              </p>
            </div>
          </>
        )}

        {mode === 'asin' && (
          <>
            <div>
              <label
                style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}
              >
                ASIN
              </label>
              <input
                type="text"
                value={asin}
                onChange={(e) => setAsin(e.target.value)}
                placeholder="例: 4065286182"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                }}
                required
              />
            </div>

            <div>
              <label
                style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}
              >
                タイトル
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                }}
              />
            </div>

            <div>
              <label
                style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}
              >
                著者名
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                }}
              />
            </div>
          </>
        )}

        {mode === 'url' && (
          <>
            <div>
              <label
                style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}
              >
                Amazon 商品ページの URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.amazon.co.jp/dp/XXXXXXXXXX"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                }}
                required
              />
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                URL から ASIN を自動抽出して登録します。
              </p>
            </div>

            <div>
              <label
                style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}
              >
                タイトル
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                }}
              />
            </div>

            <div>
              <label
                style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}
              >
                著者名
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                }}
              />
            </div>
          </>
        )}

        {/* 共通：カバー画像URL & コメント */}
        <div>
          <label
            style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}
          >
            カバー画像 URL（任意）
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
            }}
          />
        </div>

        <div>
          <label
            style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}
          >
            紹介コメント（任意）
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              resize: 'vertical',
            }}
          />
        </div>

        {error && (
          <p style={{ color: '#b91c1c', fontSize: 13 }}>{error}</p>
        )}

        <div style={{ marginTop: 8 }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '10px 20px',
              borderRadius: 999,
              border: 'none',
              background: submitting ? '#6b7280' : '#10b981',
              color: '#022c22',
              fontWeight: 600,
              cursor: submitting ? 'default' : 'pointer',
            }}
          >
            {submitting ? '登録中…' : '登録する'}
          </button>

          <Link
            href="/dashboard"
            style={{
              margin: '8px 16px',
              padding: '10px 20px',
              borderRadius: 999,
              border: '1px solid #d1d5db',
              textDecoration: 'none',
              fontSize: 14,
            }}
          >
            戻る
          </Link>
        </div>
      </form>
    </main>
  );
}
