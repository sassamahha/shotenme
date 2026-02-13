import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getShareImagePattern } from '@/lib/share-images/registry';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string; pattern: string }> }
) {
  try {
    const { handle, pattern } = await params;

    const patternConfig = getShareImagePattern(pattern);
    if (!patternConfig) {
      return new Response('Not Found', { status: 404 });
    }

    const bookstore = await prisma.bookstore.findUnique({
      where: { handle },
      include: {
        books: {
          where: { isPublic: true },
          orderBy: { sortOrder: 'asc' },
          include: { book: true },
        },
      },
    });

    if (!bookstore) {
      return new Response('Bookstore not found', { status: 404 });
    }

    // _count は filteredRelationCount なしでは使えないため、件数は books.length で渡す
    const bookstoreWithCount = {
      ...bookstore,
      _count: { books: bookstore.books.length },
    };

    const { element, width, height } = await Promise.resolve(
      patternConfig.render(bookstoreWithCount as Parameters<typeof patternConfig.render>[0])
    );

    const response = new ImageResponse(element, {
      width,
      height,
    });

    const filename = `${patternConfig.filename}-${handle}.png`;
    response.headers.set(
      'Content-Disposition',
      `inline; filename="${filename}"`
    );

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return new Response(
      JSON.stringify({ error: message, stack }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
