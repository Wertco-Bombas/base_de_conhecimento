import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';

import useUser from '../lib/useUser';
import { isAdmin } from '../lib/permissions';

export default function AdminPanel() {
  const user = useUser();

  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (user && isAdmin(user)) {
      fetchData();
    }
  }, [user]);

  async function fetchData() {
    const u = await supabase.from('profiles').select('*');
    const l = await supabase.from('audit_log').select('*');

    setUsers(u.data || []);
    setLogs(l.data || []);
  }

  async function updateRole(id, role) {
    await supabase.from('profiles').update({ role }).eq('id', id);
    fetchData();
  }

  if (!user || !isAdmin(user)) {
    return (
      <ProtectedRoute>
        <Layout>
          <p style={{ color: '#fff' }}>Sem acesso</p>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>

        <div style={{ padding: 20, color: '#fff' }}>

          <h1 style={{ color: '#f5c400' }}>Admin</h1>

          {users.map(u => (
            <div key={u.id} style={{ marginTop: 10 }}>
              <p>{u.email}</p>

              <select
                value={u.role}
                onChange={(e) => updateRole(u.id, e.target.value)}
              >
                <option>user</option>
                <option>supervisor</option>
                <option>admin</option>
              </select>
            </div>
          ))}

          <h2>Logs</h2>

          {logs.map(l => (
            <div key={l.id}>
              <p>{l.action}</p>
              <p>{l.description}</p>
            </div>
          ))}

        </div>

      </Layout>
    </ProtectedRoute>
  );
}
