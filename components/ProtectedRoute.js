import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        router.replace('/');
        return;
      }

      setLoading(false);
    }

    check();
  }, []);

  if (loading) return null;

  return children;
}
