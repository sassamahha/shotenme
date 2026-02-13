import type { ReactElement } from 'react';

/**
 * シェア用画像レンダラーに渡す書店データの型
 * API で取得した Prisma の include 結果と一致させる
 */
export type ShareImageBookstore = {
  id: string;
  handle: string | null;
  bookstoreTitle: string | null;
  displayName: string | null;
  theme: string;
  bio: string | null;
  books: Array<{
    id: string;
    sortOrder: number;
    createdAt: Date;
    book: {
      id: string;
      asin: string;
      title: string;
      isbn10: string | null;
      isbn13: string | null;
    };
  }>;
  _count: {
    books: number;
  };
};

export type ShareImageRenderResult = {
  element: ReactElement;
  width: number;
  height: number;
};

export type ShareImageRenderer = (
  bookstore: ShareImageBookstore
) => Promise<ShareImageRenderResult> | ShareImageRenderResult;

export type ShareImagePatternConfig = {
  render: ShareImageRenderer;
  /** ダウンロード時のファイル名プレフィックス（拡張子なし）。例: shoten-card */
  filename: string;
};
