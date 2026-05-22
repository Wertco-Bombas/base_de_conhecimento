import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';
import useUser from '../lib/useUser';
import { isAdmin } from '../lib/permissions';

export default function Admin() {
  const user = useUser();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from('profiles').select('*');
    setUsers(data || []);
  }

  if (!isAdmin(user)) return <p>Sem acesso</p>;

  return (
    <ProtectedRoute>
      <Layout>

        <h1 style={{ color: '#f5c400' }}>Admin</h1>

        {users.map(u => (
          <div key={u.id}>
            <p>{u.name || u.email}</p>
            <p>{u.role}</p>
          </div>
        ))}

      </Layout>
    </ProtectedRoute>
  );
}
