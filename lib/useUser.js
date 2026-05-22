import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function useUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    }

    load();
  }, []);

  return user;
}
