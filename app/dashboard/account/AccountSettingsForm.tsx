// app/dashboard/account/AccountSettingsForm.tsx
'use client';

import { useState, useTransition, FormEvent } from 'react';
import Link from 'next/link';
import { SignOutButton, UserProfile } from '@clerk/nextjs';

type User = {
  id: string;
  amazonAssociateTag: string | null;
  isPro: boolean;
};

type Props = {
  user: User;
};

export default function AccountSettingsForm({ user }: Props) {
  const [amazonTag, setAmazonTag] = useState(user.amazonAssociateTag ?? '');

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // 無料ユーザーはサーバー側でも無視する前提だけど、
          // 念のためクライアントでも null にして送る
          amazonAssociateTag: user.isPro ? amazonTag || null : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '保存に失敗しました。');
        return;
      }
      setMessage('保存しました。');
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* メールアドレス・パスワード変更 */}
      <section>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 16,
            color: '#111827',
          }}
        >
          アカウント情報
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          メールアドレスとパスワードの変更は、以下のプロフィール設定から行えます。
        </p>
        <UserProfile />
      </section>

      {/* Amazon アソシエイトタグ（Pro 限定） */}
      <form
        onSubmit={onSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 8,
            color: '#111827',
          }}
        >
          Amazon アソシエイトタグ（Pro限定）
        </h2>
        <div>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: 'block',
              marginBottom: 4,
            }}
          >
            Amazon アソシエイトタグ
          </label>
          <input
            type="text"
            value={amazonTag}
            onChange={(e) => setAmazonTag(e.target.value)}
            placeholder="例: yourtag-22"
            disabled={!user.isPro}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 999,
              border: '1px solid #d1d5db',
              fontSize: 14,
              background: user.isPro ? '#fff' : '#f3f4f6',
              color: user.isPro ? '#111827' : '#9ca3af',
            }}
          />
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
            {user.isPro
              ? '登録したタグで全書店の Amazon リンクが生成されます。'
              : '現在は無料プランです。アフィリエイトタグは設定できません。'}
          </p>

          {!user.isPro && (
            <button
              type="button"
              onClick={() => {
                // Stripe のチェックアウトに飛ばす実装をあとで入れる
                alert('Proプランの購入フローはあとで実装する想定。');
              }}
              style={{
                marginTop: 8,
                padding: '10px 18px',
                borderRadius: 999,
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Proプランにアップグレードしてタグを設定する
            </button>
          )}
        </div>

        {error && (
          <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>
        )}
        {message && (
          <p style={{ color: '#16a34a', fontSize: 13 }}>{message}</p>
        )}

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
            alignSelf: 'flex-start',
          }}
        >
          {isPending ? '保存中…' : '保存する'}
        </button>
      </form>

      {/* 戻るボタン */}
      <div>
        <Link
          href="/dashboard"
          style={{
            padding: '10px 20px',
            borderRadius: 999,
            border: '1px solid #d1d5db',
            textDecoration: 'none',
            fontSize: 14,
            color: '#111827',
            background: '#ffffff',
            display: 'inline-block',
          }}
        >
          戻る
        </Link>
      </div>

      {/* ログアウト */}
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
          ログアウト
        </h2>
        <SignOutButton>
          <button
            type="button"
            style={{
              padding: '10px 20px',
              borderRadius: 999,
              border: '1px solid #fecaca',
              background: '#fee2e2',
              color: '#b91c1c',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            ログアウト
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}

