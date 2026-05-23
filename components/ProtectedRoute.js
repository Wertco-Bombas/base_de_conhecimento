import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: '#fff' }}>Carregando...</div>;

  if (!user) {
    window.location.href = '/';
    return null;
  }

  const role = user?.role;

  if (allowedRoles.length && !allowedRoles.includes(role)) {
    return (
      <div style={{ color: '#fff', padding: 20 }}>
        Acesso negado
      </div>
    );
  }

  return children;
}
