import { supabase } from './supabaseClient';

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();

  if (!data?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return {
    ...data.user,
    role: profile?.role || 'user'
  };
}
