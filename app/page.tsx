import Link from 'next/link';
import Image from 'next/image';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

// 書店一覧を取得（新着順、公開されている本がある書店のみ）
async function getRecentBookstores() {
  return await prisma.bookstore.findMany({
    where: {
      handle: { not: null }, // handleが設定されている
      books: {
        some: { isPublic: true }, // 公開されている本が1冊以上ある
      },
    },
    include: {
      books: {
        where: { isPublic: true },
        orderBy: { sortOrder: 'asc' },
        take: 3, // 最新3冊のカバー画像用
        include: { book: true },
      },
      _count: {
        select: {
          books: {
            where: { isPublic: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' }, // 新着順
    take: 12, // 最初の12件
  });
}

export default async function Home() {
  const bookstores = await getRecentBookstores();

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      {/* ヒーローセクション */}
      <section className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Shoten.me
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            あなたの本棚、今日から&ldquo;書店&rdquo;
          </p>
          <div className="flex flex-col gap-4 justify-center items-center sm:flex-row">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-8 py-3 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors">
                  ログイン
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-8 py-3 rounded-full border-2 border-gray-900 text-gray-900 font-medium hover:bg-gray-50 transition-colors">
                  サインアップ
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="px-8 py-3 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
              >
                ダッシュボード
              </Link>
            </SignedIn>
          </div>
        </div>

        {/* 書店一覧セクション */}
        {bookstores.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-8 text-gray-900">
              新着書店
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookstores.map((bookstore) => (
                <Link
                  key={bookstore.id}
                  href={`/@${bookstore.handle}`}
                  className="group block"
                >
                  <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                    {/* 書店名と店長 */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-gray-700">
                      {bookstore.bookstoreTitle || `@${bookstore.handle}`}
                    </h3>
                    {bookstore.displayName && (
                      <p className="text-sm text-gray-500 mb-3">
                        店長：{bookstore.displayName}
                      </p>
                    )}

                    {/* 本のカバー画像（小さく3冊まで） */}
                    {bookstore.books.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {bookstore.books.slice(0, 3).map((ub) => {
                          const hasValidImage =
                            ub.book.imageUrl &&
                            ub.book.imageUrl.trim().length > 0 &&
                            (ub.book.imageUrl.startsWith('http://') ||
                              ub.book.imageUrl.startsWith('https://'));

                          return (
                            <div
                              key={ub.id}
                              className="w-12 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0"
                            >
                              {hasValidImage ? (
                                <Image
                                  src={ub.book.imageUrl!}
                                  alt={ub.book.title}
                                  width={48}
                                  height={64}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  📚
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 紹介文の抜粋 */}
                    {bookstore.bio && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {bookstore.bio.length > 60
                          ? `${bookstore.bio.slice(0, 60)}...`
                          : bookstore.bio}
                      </p>
                    )}

                    {/* 本の数 */}
                    <p className="text-xs text-gray-400">
                      {bookstore._count.books}冊の本
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
