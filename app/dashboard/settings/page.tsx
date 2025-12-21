// app/dashboard/settings/page.tsx
// このページは廃止されました。アカウント設定は /dashboard/account に移動しました。
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  redirect('/dashboard/account');
}
