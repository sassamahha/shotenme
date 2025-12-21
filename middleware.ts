import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 保護するルートを定義
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/books(.*)",
  "/api/user-books(.*)",
  "/api/settings(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
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




