-- CreateEnum
CREATE TYPE "CatalogCategory" AS ENUM ('BOOK', 'COMIC', 'LIGHTNOVEL', 'MAGAZINE', 'FIGURE', 'GOODS', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "amazonAssociateTag" TEXT,
    "rakutenAffiliateId" TEXT,
    "isPro" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "asin" TEXT NOT NULL,
    "isbn10" TEXT,
    "isbn13" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "imageUrl" TEXT,
    "rakutenUrl" TEXT,
    "category" "CatalogCategory" NOT NULL DEFAULT 'BOOK',
    "languageCode" TEXT DEFAULT 'ja',
    "level" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookstore" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "handle" TEXT,
    "bookstoreTitle" TEXT,
    "displayName" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bookstore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBook" (
    "id" TEXT NOT NULL,
    "bookstoreId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "obi" TEXT,
    "note" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBookLink" (
    "id" TEXT NOT NULL,
    "userBookId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBookLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "Book_asin_key" ON "Book"("asin");

-- CreateIndex
CREATE UNIQUE INDEX "Bookstore_handle_key" ON "Bookstore"("handle");

-- CreateIndex
CREATE INDEX "Bookstore_ownerId_idx" ON "Bookstore"("ownerId");

-- CreateIndex
CREATE INDEX "UserBook_bookstoreId_idx" ON "UserBook"("bookstoreId");

-- CreateIndex
CREATE INDEX "UserBook_bookId_idx" ON "UserBook"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBook_bookstoreId_bookId_key" ON "UserBook"("bookstoreId", "bookId");

-- CreateIndex
CREATE INDEX "UserBookLink_userBookId_idx" ON "UserBookLink"("userBookId");

-- AddForeignKey
ALTER TABLE "Bookstore" ADD CONSTRAINT "Bookstore_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBook" ADD CONSTRAINT "UserBook_bookstoreId_fkey" FOREIGN KEY ("bookstoreId") REFERENCES "Bookstore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBook" ADD CONSTRAINT "UserBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBookLink" ADD CONSTRAINT "UserBookLink_userBookId_fkey" FOREIGN KEY ("userBookId") REFERENCES "UserBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

