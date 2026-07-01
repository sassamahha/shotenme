// app/dashboard/books/new/page.tsx
// 共有リンク投入UX：貼る/検索 → 自動実体化 → 棚を選ぶ → obi 1行（任意で note）→ 追加。
// 生成UI（タイトル/著者/画像の手入力フォーム）は廃止。
'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type ResolvedBook = {
  canonicalKey: string;
  asin: string | null;
  isbn10: string | null;
  isbn13: string | null;
  title: string;
  author: string;
  imageUrl: string | null;
  rakutenUrl: string | null;
};

type Bookstore = {
  id: string;
  handle: string | null;
  bookstoreTitle: string | null;
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
};

function NewBookInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 棚（bookstore）。複数選択可（再生リスト感覚で一気に入れる）。
  // share-target からは未指定で来ることがある。
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const q = searchParams.get('bookstore');
    return q ? [q] : [];
  });
  const [bookstores, setBookstores] = useState<Bookstore[]>([]);

  const toggleShelf = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  // share-target / 手貼り双方の初期入力
  const prefill =
    searchParams.get('url') ||
    searchParams.get('text') ||
    searchParams.get('title') ||
    '';

  const [input, setInput] = useState(prefill);
  const [resolving, setResolving] = useState(false);
  const [candidates, setCandidates] = useState<ResolvedBook[]>([]);
  const [selected, setSelected] = useState<ResolvedBook | null>(null);

  const [obi, setObi] = useState('');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 棚一覧を取得（未選択なら先頭を既定に）
  useEffect(() => {
    fetch('/api/bookstores')
      .then((r) => r.json())
      .then((d) => {
        const list: Bookstore[] = d.bookstores ?? [];
        setBookstores(list);
        setSelectedIds((prev) =>
          prev.length === 0 && list.length > 0 ? [list[0].id] : prev,
        );
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolve = useCallback(async (value: string) => {
    const q = value.trim();
    if (!q) return;
    setResolving(true);
    setError(null);
    setCandidates([]);
    setSelected(null);

    try {
      const res = await fetch('/api/ingest/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || '解決に失敗しました。');
        return;
      }
      const list: ResolvedBook[] = data.candidates ?? [];
      if (list.length === 0) {
        setError(
          'この本を見つけられませんでした。リンク（Amazon/楽天）かタイトルで試してください。',
        );
        return;
      }
      setCandidates(list);
      if (list.length === 1) setSelected(list[0]); // URL/ISBN は即確定
    } catch {
      setError('解決に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setResolving(false);
    }
  }, []);

  // share-target 等で初期入力がある時は自動で解決
  useEffect(() => {
    if (prefill.trim()) resolve(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd() {
    if (!selected) return;
    if (selectedIds.length === 0) {
      setError('棚を1つ以上選択してください。');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookstoreIds: selectedIds,
          book: selected,
          obi: obi || undefined,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || '追加に失敗しました。');
        return;
      }
      router.push(`/dashboard?bookstore=${selectedIds[0]}`);
      router.refresh();
    } catch {
      setError('追加に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
        本を登録
      </h1>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
        タイトルで検索 → 書影が自動で出ます。
      </p>

      {/* 棚（bookstore）選択：複数チェック可 */}
      {bookstores.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label
            style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}
          >
            どの棚に入れる？（複数選択OK）
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {bookstores.map((b) => {
              const on = selectedIds.includes(b.id);
              const label = b.bookstoreTitle || `@${b.handle ?? b.id.slice(0, 6)}`;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => toggleShelf(b.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: on ? '1px solid #10b981' : '1px solid #d1d5db',
                    background: on ? '#ecfdf5' : '#fff',
                    color: on ? '#065f46' : '#374151',
                    fontSize: 13,
                    fontWeight: on ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {on ? '✓ ' : ''}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 貼る / 検索ボックス */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') resolve(input);
          }}
          placeholder="タイトル"
          style={inputStyle}
        />
        <button
          type="button"
          onClick={() => resolve(input)}
          disabled={resolving}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            border: 'none',
            background: resolving ? '#9ca3af' : '#111827',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            cursor: resolving ? 'default' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {resolving ? '解決中…' : '探す'}
        </button>
      </div>

      {error && (
        <p style={{ color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>{error}</p>
      )}

      {/* 候補（タイトル検索で複数のとき） */}
      {candidates.length > 1 && !selected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {candidates.map((c) => (
            <button
              key={c.canonicalKey}
              type="button"
              onClick={() => setSelected(c)}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                padding: 8,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: '#fff',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {c.imageUrl && (
                <img
                  src={c.imageUrl}
                  alt={c.title}
                  style={{ width: 40, height: 56, objectFit: 'cover' }}
                />
              )}
              <span>
                <span style={{ fontSize: 14, fontWeight: 600, display: 'block' }}>
                  {c.title}
                </span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{c.author}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 確定した本のプレビュー + obi/note */}
      {selected && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: 'flex',
              gap: 14,
              padding: 12,
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              background: '#fff',
              marginBottom: 16,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {selected.imageUrl ? (
              <img
                src={selected.imageUrl}
                alt={selected.title}
                style={{ width: 64, height: 90, objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 90,
                  background: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: '#9ca3af',
                  textAlign: 'center',
                }}
              >
                表紙なし
              </div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                {selected.title}
              </p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
                {selected.author}
              </p>
              {candidates.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: '#2563eb',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  別の候補を選ぶ
                </button>
              )}
            </div>
          </div>

          {/* obi（1行・任意） */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              帯（1行・任意）
            </label>
            <input
              type="text"
              value={obi}
              onChange={(e) => setObi(e.target.value)}
              placeholder="この本のひとこと（一覧やシェアで見える面）"
              style={inputStyle}
            />
          </div>

          {/* note（段階的開示） */}
          {!showNote ? (
            <button
              type="button"
              onClick={() => setShowNote(true)}
              style={{
                fontSize: 13,
                color: '#2563eb',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                marginBottom: 16,
              }}
            >
              ＋ もっと書く（推薦文）
            </button>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                推薦文（任意）
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                placeholder="長文の熱い想いを伝えたいときに。"
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleAdd}
            disabled={submitting}
            style={{
              padding: '10px 24px',
              borderRadius: 999,
              border: 'none',
              background: submitting ? '#6b7280' : '#10b981',
              color: '#022c22',
              fontWeight: 700,
              fontSize: 14,
              cursor: submitting ? 'default' : 'pointer',
            }}
          >
            {submitting ? '追加中…' : '棚に追加'}
          </button>
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: '#6b7280' }}>
          ← ダッシュボードに戻る
        </Link>
      </div>
    </main>
  );
}

export default function NewBookPage() {
  return (
    <Suspense fallback={<main style={{ padding: 32 }}>読み込み中…</main>}>
      <NewBookInner />
    </Suspense>
  );
}
