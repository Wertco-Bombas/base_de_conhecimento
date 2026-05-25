import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Usuarios() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (!error) setUsers(data || []);
    }

    load();
  }, []);

  return (
    <Layout>
      <h1 style={{ color: '#fff' }}>Usuários</h1>

      <div style={{ color: '#fff' }}>
        {users.map(u => (
          <div key={u.id} style={{ padding: 10, borderBottom: '1px solid #333' }}>
            <p><b>Email:</b> {u.email}</p>
            <p><b>Role:</b> {u.role}</p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
