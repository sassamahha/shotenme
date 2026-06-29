import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { themeOgColor } from '@/lib/themes';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;

    const bookstore = await prisma.bookstore.findUnique({
      where: { handle },
      include: {
        books: {
          where: { isPublic: true },
          orderBy: { sortOrder: 'asc' },
          take: 3, // 最大3冊の書影
          include: { book: true },
        },
      },
    });

    if (!bookstore) {
      return new Response('Bookstore not found', { status: 404 });
    }

    const bookCount = await prisma.userBook.count({
      where: { bookstoreId: bookstore.id, isPublic: true },
    });

    const title = bookstore.bookstoreTitle || `@${bookstore.handle}`;
    const displayName = bookstore.displayName || '';
    const bio = bookstore.bio
      ? bookstore.bio.split('\n')[0].slice(0, 60) + (bookstore.bio.length > 60 ? '...' : '')
      : '';

    // テーマに基づく背景色（OGPは単色）
    const backgroundColor = themeOgColor(bookstore.theme);

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor,
            padding: '40px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* 書店名と店長 */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '8px',
              }}
            >
              {title}
            </h1>
            {displayName && (
              <p style={{ fontSize: '24px', color: '#6b7280' }}>
                店長：{displayName}
              </p>
            )}
          </div>

          {/* 書影（最大3冊） */}
          {bookstore.books.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              {bookstore.books.map((ub) => {
                const hasValidImage =
                  ub.book.imageUrl &&
                  ub.book.imageUrl.trim().length > 0 &&
                  (ub.book.imageUrl.startsWith('http://') ||
                    ub.book.imageUrl.startsWith('https://'));

                return (
                  <div
                    key={ub.id}
                    style={{
                      width: '120px',
                      height: '160px',
                      backgroundColor: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    {hasValidImage ? (
                      <img
                        src={ub.book.imageUrl!}
                        alt={ub.book.title}
                        width={120}
                        height={160}
                        style={{
                          objectFit: 'cover',
                          width: '100%',
                          height: '100%',
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '32px' }}>📚</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 説明文 */}
          {bio && (
            <p
              style={{
                fontSize: '20px',
                color: '#4b5563',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}
            >
              {bio}
            </p>
          )}

          {/* 本の冊数 */}
          <p style={{ fontSize: '18px', color: '#9ca3af' }}>
            {bookCount}冊の本
          </p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return new Response(
      JSON.stringify({ error: message, stack }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

