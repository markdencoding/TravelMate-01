import { Suspense } from 'react';
import { LandingScreen } from '@/screens/LandingScreen';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <LandingScreen />
    </Suspense>
  );
}
