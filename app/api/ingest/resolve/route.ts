// app/api/ingest/resolve/route.ts
// 貼られた1本の入力 → 本カード候補に解決（プレビュー用。DBには書かない）。
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { resolveInput } from '@/lib/ingest';

export async function POST(req: NextRequest) {
  try {
    // 解決はログイン確認だけでよい（DBは触らない＝接続を消費しない）
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: '認証が必要です。' }, { status: 401 });
    }

    const { input } = (await req.json()) as { input?: string };
    if (!input || !input.trim()) {
      return NextResponse.json(
        { message: 'リンクかタイトルを入力してください。' },
        { status: 400 },
      );
    }

    const result = await resolveInput(input);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('POST /api/ingest/resolve error', err);
    return NextResponse.json(
      { message: '解決に失敗しました。' },
      { status: 500 },
    );
  }
}
