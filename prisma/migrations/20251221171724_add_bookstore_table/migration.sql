-- CreateTable: Bookstore
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

-- CreateIndex
CREATE UNIQUE INDEX "Bookstore_handle_key" ON "Bookstore"("handle");
CREATE INDEX "Bookstore_ownerId_idx" ON "Bookstore"("ownerId");

-- AddForeignKey
ALTER TABLE "Bookstore" ADD CONSTRAINT "Bookstore_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Data Migration: Create Bookstore for each existing User
INSERT INTO "Bookstore" ("id", "ownerId", "handle", "bookstoreTitle", "displayName", "theme", "bio", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text as "id",
    "id" as "ownerId",
    "handle",
    "bookstoreTitle",
    "displayName",
    "theme",
    "bio",
    "createdAt",
    "updatedAt"
FROM "User";

-- Add bookstoreId column to UserBook (nullable first)
ALTER TABLE "UserBook" ADD COLUMN "bookstoreId" TEXT;

-- Update UserBook: Set bookstoreId from User's Bookstore
UPDATE "UserBook" ub
SET "bookstoreId" = (
    SELECT b.id
    FROM "Bookstore" b
    WHERE b."ownerId" = ub."userId"
    LIMIT 1
);

-- Make bookstoreId NOT NULL
ALTER TABLE "UserBook" ALTER COLUMN "bookstoreId" SET NOT NULL;

-- AddForeignKey for bookstoreId
ALTER TABLE "UserBook" ADD CONSTRAINT "UserBook_bookstoreId_fkey" FOREIGN KEY ("bookstoreId") REFERENCES "Bookstore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old foreign key and index
ALTER TABLE "UserBook" DROP CONSTRAINT "UserBook_userId_fkey";
DROP INDEX IF EXISTS "UserBook_userId_idx";
DROP INDEX IF EXISTS "UserBook_userId_bookId_key";

-- Drop userId column
ALTER TABLE "UserBook" DROP COLUMN "userId";

-- Create new indexes
CREATE INDEX "UserBook_bookstoreId_idx" ON "UserBook"("bookstoreId");
CREATE UNIQUE INDEX "UserBook_bookstoreId_bookId_key" ON "UserBook"("bookstoreId", "bookId");

-- Drop columns from User table
ALTER TABLE "User" DROP COLUMN "handle";
ALTER TABLE "User" DROP COLUMN "displayName";
ALTER TABLE "User" DROP COLUMN "bookstoreTitle";
ALTER TABLE "User" DROP COLUMN "theme";
ALTER TABLE "User" DROP COLUMN "bio";

-- Drop old index
DROP INDEX IF EXISTS "User_handle_key";

