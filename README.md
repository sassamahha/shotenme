# Shoten.me

> じぶんの「本屋ページ」を最短で立ち上げる、個人店長向け SaaS α版

読んだ本・推した本を棚に並べるたいだけの “書店” をつくるツールです。  
店長ごとの書店は `/@handle`（実装ルートは `/u/[handle]`）で公開されます。  
例：`https://shoten.me/@sassamahha` → `app/u/sassamahha`

---

## 機能概要（α版）

- **本の登録**
  - ISBN / ASIN / Amazon 商品URLからメタデータを自動取得
  - タイトル・著者・カバー画像・紹介コメントを編集可能

- **公開書店ページ**
  - 書店ID（handle）ごとの公開ページを自動生成
  - 本ごとに「公開 / 非公開」を切り替え可能
  - 並び順はドラッグ&ドロップで変更

- **店長向けダッシュボード（書棚 / Back Yard）**
  - 書店名・店長名・自己紹介の編集
  - 本棚の並び替え・非公開管理
  - ログイン中の店長のデータだけが見えるマルチテナント構成

---

## 技術スタック

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Auth**: Clerk
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **UI**: React + Tailwind CSS
- **Deploy**: Vercel

---

## セットアップ

### 必要なもの

- Node.js 18+
- npm / pnpm / yarn のいずれか
- Supabase プロジェクト（PostgreSQL）
- Clerk アプリケーション（開発環境用 / 本番環境用）

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env.local` を作成し、以下を定義します。

```env
# ============================================
# Prisma / Supabase
# ============================================
# Supabase の Session pooler 接続文字列
# Supabase ダッシュボード: Project → Connect → Connection string
# Type: URI, Source: Primary Database, Method: Session pooler
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-xx-region-1.pooler.supabase.com:5432/postgres"

# Supabase の Direct 接続文字列（Prisma Studio などで使用）
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# ============================================
# Clerk Authentication
# ============================================
# Clerk ダッシュボードの API Keys から取得
CLERK_SECRET_KEY="sk_xxx_your_clerk_secret_key"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_xxx_your_clerk_publishable_key"

# サインイン／サインアップルート
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
```

⚠️ `.env.local` は必ず `.gitignore` に含め、GitHubにはコミットしないでください。

### 3. データベースマイグレーション

```bash
# スキーマを適用
npx prisma migrate dev

# Prisma Client の生成
npx prisma generate
```

**本番環境の場合**:
```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスして動作確認します。

## セキュリティ方針（α版）

現時点では Supabase RLS は未使用。アプリケーション層でマルチテナント隔離を実装しています。

- **API レイヤー**: すべての `/api/**` ルートで `getCurrentUser()` を呼び出し、未認証は 401、他人のデータアクセスは 403 を返却
- **マルチテナント隔離**: すべての CRUD 操作で `userId` を条件に含めることを徹底
- **公開ページ**: `handle` が一致し、`isPublic: true` の本のみ表示
- **管理画面**: URL に ID を含む場合も、サーバー側で必ず `userId` をチェック

## ロードマップ

### Phase 1（現在）：α公開版

- Clerk 認証導入済み（誰でもサインアップ可能）
- マルチテナント隔離をアプリケーション層で実装
- すべての購入リンクは運営側の Amazon アソシエイトタグ（`shotenme-22`）を使用

### Phase 2：店長向けアフィタグ解放（将来）

- 店長ごとの独自アフィリエイトタグ登録（Amazonアソシエイト等）
- Stripe の導入
- 必要になった場合のみ、招待制・審査制を検討

### Phase 3：Supabase RLS 導入（将来）

- Supabase の Row Level Security を導入し、DBレイヤでもテナント隔離を強化
- Clerk 認証を使っているため、アプリケーション層の認証を前提とした補助的なRLSとして設計