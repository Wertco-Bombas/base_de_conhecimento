import { supabase } from './supabaseClient';

export async function getCurrentUser() {
  const { data: session } = await supabase.auth.getSession();

  if (!session?.session?.user) return null;

  const user = session.session.user;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return {
    ...user,
    role: profile?.role || 'user'
  };
}
