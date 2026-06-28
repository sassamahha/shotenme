// app/manifest.ts
// PWA マニフェスト。share_target で OS の共有シートから本を放り込む（本命の入口）。
// 注意: Web Share Target は Android/Chrome 系のみ。iOS Safari は非対応（Shortcut で代替）。
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shoten.me',
    short_name: 'Shoten',
    description: 'あなたの本棚、今日から「書店」。',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#111827',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    // 共有シートから貼られた url/text/title を ingest 画面へ橋渡し（GET）
    // 型に share_target が無いためキャストで付与
    ...({
      share_target: {
        action: '/dashboard/books/new',
        method: 'GET',
        params: { title: 'title', text: 'text', url: 'url' },
      },
    } as Record<string, unknown>),
  };
}
