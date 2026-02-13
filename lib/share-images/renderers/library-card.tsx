import type { ShareImageBookstore, ShareImageRenderResult } from '../types';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

// @vercel/og のデフォルトバンドルフォントのみ使用（外部 fetch なしで確実に画像生成）
const FONT = 'Noto Sans';

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function isbnOrAsin(book: { isbn10: string | null; isbn13: string | null; asin: string }): string {
  return book.isbn10 ?? book.isbn13 ?? book.asin;
}

export function renderLibraryCard(bookstore: ShareImageBookstore): ShareImageRenderResult {
  const storeName = bookstore.bookstoreTitle || `@${bookstore.handle}`;
  const ownerName = bookstore.displayName ?? '';
  const handle = bookstore.handle ?? '';
  const bookCount = bookstore._count.books;
  const rows = bookstore.books.slice(0, 8);
  const emptyRows = Math.max(0, 4 - (8 - rows.length));

  return {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    element: (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f5edda',
          padding: 32,
          fontFamily: FONT,
          borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 20,
              letterSpacing: 6,
              color: '#a08860',
              marginBottom: 4,
            }}
          >
            書 店 カ ー ド
          </div>
          <div
            style={{
              display: 'flex',
              width: '70%',
              borderBottom: '1.5px dashed #b09870',
              marginBottom: 8,
            }}
          />
          <div
            style={{
              display: 'flex',
              fontSize: 44,
              fontWeight: 700,
              color: '#5a4530',
              letterSpacing: 4,
              marginBottom: 2,
            }}
          >
            {storeName}
          </div>
          <div
            style={{
              display: 'flex',
              width: '85%',
              borderBottom: '1.5px dashed #b09870',
              marginBottom: 6,
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 6,
            }}
          >
            <span style={{ fontSize: 26, color: '#a08860', letterSpacing: 3 }}>
              店 主
            </span>
            <span style={{ fontSize: 30, color: '#5a4530', letterSpacing: 2 }}>
              {ownerName}
            </span>
          </div>
        </div>

        {/* テーブル（flex で表現） */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 14 }}>
          {/* ヘッダー行 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              borderBottom: '1.2px solid #b09870',
              backgroundColor: 'rgba(180, 160, 120, 0.08)',
            }}
          >
          <div
            style={{
              display: 'flex',
              width: '22%',
              padding: '10px 6px',
              fontSize: 22,
              fontWeight: 700,
              color: '#5a4530',
              textAlign: 'center',
              borderRight: '1.2px solid #b09870',
            }}
          >
            ISBN ASIN
          </div>
          <div
            style={{
              display: 'flex',
              width: '52%',
              padding: '10px 6px',
              fontSize: 22,
              fontWeight: 700,
              color: '#5a4530',
              textAlign: 'center',
              borderRight: '1.2px solid #b09870',
            }}
          >
            書　　名
          </div>
          <div
            style={{
              display: 'flex',
              width: '26%',
              padding: '10px 6px',
              fontSize: 22,
              fontWeight: 700,
              color: '#5a4530',
              textAlign: 'center',
            }}
          >
            登録日
          </div>
          </div>
          {/* データ行 */}
          {rows.map((ub) => (
            <div
              key={ub.id}
              style={{
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                borderBottom: '1.2px solid #b09870',
                minHeight: 38,
              }}
            >
              <div
                style={{
                  width: '22%',
                  padding: '4px 6px',
                  fontSize: 18,
                  color: '#7a6a50',
                  textAlign: 'center',
                  borderRight: '1.2px solid #b09870',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {isbnOrAsin(ub.book)}
              </div>
              <div
                style={{
                  width: '52%',
                  padding: '4px 10px 4px 12px',
                  fontSize: 20,
                  color: '#5a4530',
                  textAlign: 'left',
                  borderRight: '1.2px solid #b09870',
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                {ub.book.title}
              </div>
              <div
                style={{
                  width: '26%',
                  padding: '4px 6px',
                  fontSize: 18,
                  color: '#7a6a50',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {formatDate(new Date(ub.createdAt))}
              </div>
            </div>
          ))}
          {/* 空行 */}
          {Array.from({ length: emptyRows }).map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                borderBottom: '1.2px solid #b09870',
                minHeight: 38,
                opacity: 0.3,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: '22%',
                  borderRight: '1.2px solid #b09870',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  width: '52%',
                  borderRight: '1.2px solid #b09870',
                }}
              />
              <div style={{ display: 'flex', width: '26%' }} />
            </div>
          ))}
        </div>

        {/* フッター */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 10,
          }}
        >
          <div
            style={{
              width: 112,
              height: 112,
              border: '2.5px solid #cc4444',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cc4444',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 1,
              transform: 'rotate(-12deg)',
              opacity: 0.7,
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            <span>shoten</span>
            <span>.me</span>
          </div>
          <div style={{ display: 'flex', fontSize: 20, color: '#a08860' }}>
            蔵書 {bookCount} 冊
          </div>
          <div style={{ display: 'flex', fontSize: 20, color: '#a08860', letterSpacing: 1 }}>
            shoten.me/@{handle}
          </div>
        </div>
      </div>
    ),
  };
}
