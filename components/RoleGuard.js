import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function RoleGuard({ children, allowedRoles = [] }) {
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        router.replace('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      const role = profile?.role || 'user';

      if (!allowedRoles.includes(role)) {
        router.replace('/base');
        return;
      }

      setOk(true);
      setLoading(false);
    }

    check();
  }, []);

  if (loading) return null;

  return ok ? children : null;
}
