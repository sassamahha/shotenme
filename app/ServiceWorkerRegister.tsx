// app/ServiceWorkerRegister.tsx
// SW を登録して PWA を installable にする（share_target の前提）。
'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // 登録失敗は致命ではない（PWA 機能が無効になるだけ）
      });
    }
  }, []);
  return null;
}
