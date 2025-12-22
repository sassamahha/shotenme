'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Home, Settings, Plus, X } from 'lucide-react';

type Bookstore = {
  id: string;
  handle: string | null;
  bookstoreTitle: string | null;
};

type Props = {
  bookstores: Bookstore[];
  currentBookstoreId: string | null;
};

export default function Sidebar({ bookstores, currentBookstoreId: initialBookstoreId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const bookstoreIdFromUrl = searchParams.get('bookstore');
  const currentBookstoreId = bookstoreIdFromUrl || initialBookstoreId;

  // スマホでメニューを開閉
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // サイドバー外をクリックで閉じる（スマホのみ）
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.sidebar') && !target.closest('.menu-toggle')) {
          setIsOpen(false);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sidebarContent = (
    <div
      className={`sidebar ${isMobile && isOpen ? 'sidebar-open' : ''}`}
      style={{
        background: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        height: '100vh',
        position: isMobile ? 'fixed' : 'relative', // PCではrelative、スマホではfixed
        left: isMobile ? 0 : 'auto',
        top: isMobile ? 0 : 'auto',
        width: 200,
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: isMobile ? 50 : 'auto',
        transform: isMobile && !isOpen ? 'translateX(-100%)' : 'none',
        transition: isMobile ? 'transform 0.3s ease' : 'none',
        boxSizing: 'border-box',
        flexShrink: 0, // PCでflexbox内で幅を固定
      }}
    >
      {/* 書店一覧 */}
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#6b7280',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          書店
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {bookstores.map((bookstore) => {
            const isActive = bookstore.id === currentBookstoreId;
            return (
              <div
                key={bookstore.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  color: isActive ? '#111827' : '#6b7280',
                  background: isActive ? '#f3f4f6' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 14,
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Link
                  href={`/dashboard?bookstore=${bookstore.id}`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flex: 1,
                    textDecoration: 'none',
                    color: 'inherit',
                    overflow: 'hidden',
                  }}
                >
                  <Home size={16} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bookstore.bookstoreTitle || `@${bookstore.handle || '未設定'}`}
                  </span>
                </Link>
                {isActive && (
                  <Link
                    href={`/dashboard/bookstores/${bookstore.id}/settings`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                      borderRadius: 4,
                      color: '#6b7280',
                      textDecoration: 'none',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Settings size={14} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 書店を追加 */}
      <Link
        href="/dashboard/bookstores/new"
        onClick={() => setIsOpen(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 8,
          textDecoration: 'none',
          color: '#10b981',
          fontSize: 14,
          fontWeight: 500,
          marginBottom: 24,
          border: '1px solid #d1fae5',
          background: '#f0fdf4',
        }}
      >
        <Plus size={16} />
        <span>書店を追加</span>
      </Link>

      {/* アカウント設定（スマホでは上部に表示） */}
      <div 
        style={{ 
          ...(isMobile ? {
            marginTop: 0,
            marginBottom: 'auto',
            paddingTop: 0,
            paddingBottom: 24,
            borderTop: 'none',
            borderBottom: '1px solid #e5e7eb',
          } : {
            marginTop: 'auto',
            paddingTop: 24,
            borderTop: '1px solid #e5e7eb',
          })
        }}
      >
        <Link
          href="/dashboard/account"
          onClick={() => setIsOpen(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 8,
            textDecoration: 'none',
            color: '#6b7280',
            fontSize: 14,
            fontWeight: 400,
          }}
        >
          <Settings size={16} />
          <span>アカウント設定</span>
        </Link>
      </div>
    </div>
  );

  // サイドバーの開閉状態をbodyに反映（スマホのみ）
  useEffect(() => {
    if (isMobile) {
      if (isOpen) {
        document.body.classList.add('sidebar-open-mobile');
      } else {
        document.body.classList.remove('sidebar-open-mobile');
      }
      return () => {
        document.body.classList.remove('sidebar-open-mobile');
      };
    }
  }, [isMobile, isOpen]);

  return (
    <>
      {/* ハンバーガーメニューボタン（スマホのみ表示） */}
      <button
        className="menu-toggle"
        onClick={toggleMenu}
        style={{
          position: 'fixed',
          left: 16,
          top: 16,
          zIndex: 100,
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 8,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="メニューを開く"
      >
        {isOpen ? <X size={20} /> : <span style={{ fontSize: 20 }}>☰</span>}
      </button>

      {/* オーバーレイ（スマホのみ） */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
          }}
        />
      )}

      {/* サイドバー */}
      {sidebarContent}
    </>
  );
}
