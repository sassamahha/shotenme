// app/dashboard/bookstores/[bookstoreId]/settings/BookstoreSettingsForm.tsx
'use client';

import { useState, useTransition, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Bookstore = {
  id: string;
  handle: string | null;
  displayName: string | null;
  bookstoreTitle: string | null;
  theme: string;
  bio: string | null;
};

type Props = {
  bookstore: Bookstore;
};

export default function BookstoreSettingsForm({ bookstore }: Props) {
  const router = useRouter();
  const [handle, setHandle] = useState(bookstore.handle ?? '');
  const [displayName, setDisplayName] = useState(bookstore.displayName ?? '');
  const [bookstoreTitle, setBookstoreTitle] = useState(
    bookstore.bookstoreTitle ?? '',
  );
  const [theme, setTheme] = useState(bookstore.theme ?? 'default');
  const [bio, setBio] = useState(bookstore.bio ?? '');

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    // 軽いバリデーション（a〜z,0〜9,_ だけ許可など）
    if (handle && !/^[a-z0-9_]{3,20}$/.test(handle)) {
      setError(
        '書店IDは 3〜20 文字の半角英数字とアンダースコアにしてください。',
      );
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/bookstores/${bookstore.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: handle || null,
          displayName: displayName || null,
          bookstoreTitle: bookstoreTitle || null,
          theme,
          bio: bio || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '保存に失敗しました。');
        return;
      }
      setMessage('保存しました。');
      // ダッシュボードにリダイレクト
      router.push(`/dashboard?bookstore=${bookstore.id}`);
    });
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `「${bookstore.bookstoreTitle || bookstore.handle || 'この書店'}」を削除しますか？この操作は取り消せません。`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/bookstores/${bookstore.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '削除に失敗しました。');
        return;
      }

      // ダッシュボードにリダイレクト
      router.push('/dashboard');
    } catch (err) {
      console.error('Delete error:', err);
      alert('削除に失敗しました。');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* 書店タイトル */}
      <div>
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            display: 'block',
            marginBottom: 4,
          }}
        >
          書店の名前
        </label>
        <input
          type="text"
          value={bookstoreTitle}
          onChange={(e) => setBookstoreTitle(e.target.value)}
          placeholder="@jun の本屋"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 999,
            border: '1px solid #d1d5db',
            fontSize: 14,
          }}
        />
      </div>

      {/* 書店ID */}
      <div>
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            display: 'block',
            marginBottom: 4,
          }}
        >
          書店ID
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, color: '#6b7280' }}>@</span>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 999,
              border: '1px solid #d1d5db',
              fontSize: 14,
            }}
          />
        </div>
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
          書店URLは <code>https://shoten.me/@{handle || 'yourname'}</code> です。
        </p>
      </div>

      {/* 店長の名前 */}
      <div>
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            display: 'block',
            marginBottom: 4,
          }}
        >
          店長の名前
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Jun Sasaki"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 999,
            border: '1px solid #d1d5db',
            fontSize: 14,
          }}
        />
      </div>

      {/* 書店の紹介 */}
      <div>
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            display: 'block',
            marginBottom: 4,
          }}
        >
          書店の紹介
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 140))}
          rows={3}
          placeholder="本屋のコンセプトや、SNSリンクなどを140文字まで。"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 16,
            border: '1px solid #d1d5db',
            fontSize: 14,
            resize: 'vertical',
          }}
        />
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
          最大 140 文字。URL を含めると自動でリンクになります。
        </p>
      </div>

      {/* テーマ */}
      <div>
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            display: 'block',
            marginBottom: 4,
          }}
        >
          テーマ（背景）
        </label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 999,
            border: '1px solid #d1d5db',
            fontSize: 14,
            background: '#fff',
          }}
        >
          <option value="default">ライトグレー（デフォルト）</option>
          <option value="warm">あたたかいグラデーション</option>
          <option value="paper">紙っぽいオフホワイト</option>
        </select>
      </div>

      {error && (
        <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>
      )}
      {message && (
        <p style={{ color: '#16a34a', fontSize: 13 }}>{message}</p>
      )}

      {/* 保存＋戻るボタン */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 8,
        }}
      >
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '10px 20px',
            borderRadius: 999,
            border: 'none',
            background: isPending ? '#6b7280' : '#16a34a',
            color: '#022c22',
            fontWeight: 600,
            cursor: isPending ? 'default' : 'pointer',
            fontSize: 14,
          }}
        >
          {isPending ? '保存中…' : '保存する'}
        </button>

        <Link
          href={`/dashboard?bookstore=${bookstore.id}`}
          style={{
            padding: '10px 20px',
            borderRadius: 999,
            border: '1px solid #d1d5db',
            textDecoration: 'none',
            fontSize: 14,
            color: '#111827',
            background: '#ffffff',
          }}
        >
          戻る
        </Link>
      </div>

      {/* 書店の削除 */}
      <div
        style={{
          marginTop: 32,
          paddingTop: 32,
          borderTop: '1px solid #e5e7eb',
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 16,
            color: '#111827',
          }}
        >
          書店の削除
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          この書店とすべての本を削除します。この操作は取り消せません。
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          style={{
            padding: '10px 20px',
            borderRadius: 999,
            border: '1px solid #fecaca',
            background: '#fee2e2',
            color: '#b91c1c',
            fontWeight: 600,
            fontSize: 14,
            cursor: isDeleting ? 'not-allowed' : 'pointer',
            opacity: isDeleting ? 0.6 : 1,
          }}
        >
          {isDeleting ? '削除中…' : '書店を削除する'}
        </button>
      </div>
    </form>
  );
}

