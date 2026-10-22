import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LandingScreen } from '@/screens/LandingScreen';

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <LandingScreen />
    </Suspense>
  );
}
