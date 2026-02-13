import { renderLibraryCard } from './renderers/library-card';
import type { ShareImagePatternConfig } from './types';

/**
 * シェア用画像のパターン一覧。
 * 新パターン追加時はレンダラーを実装し、ここに 1 件登録する。
 */
export const SHARE_IMAGE_PATTERNS: Record<string, ShareImagePatternConfig> = {
  'library-card': {
    render: renderLibraryCard,
    filename: 'shoten-card',
  },
} as const;

export type ShareImagePatternId = keyof typeof SHARE_IMAGE_PATTERNS;

export function getShareImagePattern(
  patternId: string
): ShareImagePatternConfig | null {
  return SHARE_IMAGE_PATTERNS[patternId] ?? null;
}

export function isKnownShareImagePattern(patternId: string): patternId is ShareImagePatternId {
  return patternId in SHARE_IMAGE_PATTERNS;
}
