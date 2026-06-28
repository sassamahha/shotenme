import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { MAINTENANCE } from "@/lib/flags";

// 保護するルートを定義
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/ingest(.*)",
  "/api/user-books(.*)",
  "/api/settings(.*)",
]);

// 公開コンテンツ（リビルド中はログイン外から覗かせない）
const isPublicContent = createRouteMatcher(["/", "/@(.*)", "/u/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // メンテナンス中: 未ログインの訪問者は公開ページで「準備中」へ
  if (MAINTENANCE && isPublicContent(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.rewrite(new URL("/maintenance", req.url));
    }
  }

  // 保護されたルートの場合、認証を要求
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // 静的ファイル、画像、faviconを除外
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // APIルートを含める
    "/(api|trpc)(.*)",
  ],
};




