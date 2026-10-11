import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminScreen } from '@/screens/AdminScreen';

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is authenticated in Supabase, verify role on server
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      redirect('/dashboard?error=admin_required');
    }
  }

  return <AdminScreen />;
}
