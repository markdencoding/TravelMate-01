import { Suspense } from 'react';
import { AuthScreen } from '@/screens/AuthScreen';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950" />}>
      <AuthScreen />
    </Suspense>
  );
}
