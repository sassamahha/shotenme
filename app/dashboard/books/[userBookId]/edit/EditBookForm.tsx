// app/dashboard/books/[userBookId]/edit/EditBookForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type EditBookFormProps = {
  userBookId: string;
  bookstoreId: string;
  initial: {
    title: string;
    author: string;
    asin: string;
    imageUrl: string | null;
    comment: string | null;
    isPublic: boolean;
  };
};

export default function EditBookForm({ userBookId, bookstoreId, initial }: EditBookFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initial.title ?? '');
  const [author, setAuthor] = useState(initial.author ?? '');
  const [imageUrl, setImageUrl] = useState(initial.imageUrl ?? '');
  const [comment, setComment] = useState(initial.comment ?? '');
  const [isPublic, setIsPublic] = useState(initial.isPublic);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/user-books/${userBookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          imageUrl: imageUrl.trim(),
          comment: comment.trim(),
          isPublic,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || '更新に失敗しました。');
      }

      router.push(`/dashboard?bookstore=${bookstoreId}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : '更新に失敗しました。';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('この本をマイ本屋から削除しますか？')) return;

    setError(null);
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/user-books/${userBookId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || '削除に失敗しました。');
      }

      router.push(`/dashboard?bookstore=${bookstoreId}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : '削除に失敗しました。';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: 960, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* タイトル */}
      <div>
        <label
          htmlFor="title"
          style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}
        >
          タイトル
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            fontSize: 14,
          }}
        />
      </div>

      {/* 著者名 */}
      <div>
        <label
          htmlFor="author"
          style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}
        >
          著者名
        </label>
        <input
          id="author"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            fontSize: 14,
          }}
        />
      </div>

      {/* ASIN（参照用・編集不可） */}
      <div>
        <label
          htmlFor="asin"
          style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}
        >
          ASIN
        </label>
        <input
          id="asin"
          type="text"
          value={initial.asin}
          readOnly
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: '#f9fafb',
            fontSize: 14,
            color: '#6b7280',
          }}
        />
      </div>

      {/* 商品画像 URL */}
      <div>
        <label
          htmlFor="imageUrl"
          style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}
        >
          商品画像 URL（Amazon の画像 URL をコピペ）
        </label>
        <input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://m.media-amazon.com/images/..."
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            fontSize: 14,
          }}
        />
        <p style={{ marginTop: 6, fontSize: 12, color: '#9ca3af' }}>
          表紙画像を差し替えたいときだけ入力。空のままでもOKです。
        </p>
      </div>

      {/* 推薦文 */}
      <div>
        <label
          htmlFor="comment"
          style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}
        >
          推薦文：１行目が帯になります。
        </label>
        <textarea
          id="comment"
          rows={6}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        />
      </div>

      {/* 公開設定 */}
      <div>
        <label
          htmlFor="isPublic"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <input
            id="isPublic"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            style={{
              width: 18,
              height: 18,
              cursor: 'pointer',
            }}
          />
          <span>公開ページに表示する</span>
        </label>
        <p style={{ marginTop: 4, fontSize: 12, color: '#9ca3af', marginLeft: 26 }}>
          オフにすると、この本は公開ページに表示されません。
        </p>
      </div>

      {/* エラー表示 */}
      {error && (
        <p style={{ color: '#dc2626', fontSize: 13, marginTop: 4 }}>{error}</p>
      )}

      {/* ボタン群 */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button
          type="submit"
          disabled={isSaving || isDeleting}
          style={{
            padding: '10px 20px',
            borderRadius: 999,
            border: 'none',
            background: '#10b981',
            color: '#022c22',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            opacity: isSaving || isDeleting ? 0.7 : 1,
          }}
        >
          {isSaving ? '保存中…' : '保存する'}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isSaving || isDeleting}
          style={{
            padding: '10px 20px',
            borderRadius: 999,
            border: '1px solid #fecaca',
            background: '#fee2e2',
            color: '#b91c1c',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            opacity: isSaving || isDeleting ? 0.7 : 1,
          }}
        >
          {isDeleting ? '削除中…' : '削除する'}
        </button>
      </div>
    </form>
  );
}
