import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function useUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      const authUser = data?.user;

      if (!authUser) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      setUser({
        ...authUser,
        ...profile
      });
    }

    load();
  }, []);

  return user;
}
