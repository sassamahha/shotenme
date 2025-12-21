'use client';

import Link from 'next/link';
import { MonitorSmartphone, BookPlus } from 'lucide-react';

type Props = {
  handle: string | null;
  bookstoreId: string;
};

export default function MenuButtons({ handle, bookstoreId }: Props) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {/* 書店のプレビュー */}
      {handle && (
        <Link
          href={`/@${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            border: '1px solid #d1d5db',
            fontSize: 14,
            textDecoration: 'none',
            color: '#111827',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 44,
            minHeight: 44,
          }}
          className="menu-button"
        >
          <span className="menu-button-text">書店のプレビュー</span>
          <MonitorSmartphone size={20} className="menu-button-icon" />
        </Link>
      )}

      {/* 本を追加する */}
      <Link
        href={`/dashboard/books/new?bookstore=${bookstoreId}`}
        style={{
          padding: '8px 16px',
          borderRadius: 999,
          background: '#10b981',
          color: '#022c22',
          fontWeight: 600,
          fontSize: 14,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 44,
          minHeight: 44,
        }}
        className="menu-button menu-button-primary"
      >
        <span className="menu-button-text">本を追加する</span>
        <BookPlus size={20} className="menu-button-icon" />
      </Link>
    </div>
  );
}

