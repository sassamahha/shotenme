// lib/themes.ts
// 棚の背景テーマ。将来は背景画像のアップロードに拡張予定。今はプリセット10個。
// 文字色は濃色(#111827)固定なので、可読性のため淡色系で揃えている。
export type Theme = {
  key: string;
  label: string;
  background: string; // 公開ページ用CSS（グラデーション可）
  ogColor: string; // OGP画像用の単色（Satori制約のため単色で持つ）
};

export const THEMES: Theme[] = [
  { key: 'default', label: 'ライトグレー（デフォルト）', background: '#f3f4f6', ogColor: '#f3f4f6' },
  { key: 'paper', label: '紙っぽいオフホワイト', background: '#fdfaf3', ogColor: '#fdfaf3' },
  { key: 'warm', label: 'あたたかい夕焼け', background: 'linear-gradient(135deg,#fde68a,#fca5a5)', ogColor: '#fde68a' },
  { key: 'sakura', label: '桜', background: 'linear-gradient(135deg,#fce7f3,#fbcfe8)', ogColor: '#fce7f3' },
  { key: 'matcha', label: '抹茶', background: 'linear-gradient(135deg,#ecfccb,#d9f99d)', ogColor: '#ecfccb' },
  { key: 'ocean', label: '海', background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', ogColor: '#dbeafe' },
  { key: 'lavender', label: 'ラベンダー', background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', ogColor: '#ede9fe' },
  { key: 'cream', label: 'クリーム', background: '#fef9c3', ogColor: '#fef9c3' },
  { key: 'mint', label: 'ミント', background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', ogColor: '#d1fae5' },
  { key: 'sepia', label: 'セピア', background: '#f3e9d2', ogColor: '#f3e9d2' },
];

export function themeBackground(key?: string | null): string {
  return (THEMES.find((t) => t.key === key) ?? THEMES[0]).background;
}

export function themeOgColor(key?: string | null): string {
  return (THEMES.find((t) => t.key === key) ?? THEMES[0]).ogColor;
}
