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
    if (!user) return;

    if (!isAdmin(user)) return;

    fetchData();
  }, [user]);

  async function fetchData() {
    const { data: usersData } = await supabase.from('profiles').select('*');
    const { data: logsData } = await supabase.from('audit_log').select('*');

    setUsers(usersData || []);
    setLogs(logsData || []);
  }

  async function updateRole(id, role) {
    await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id);

    fetchData();
  }

  if (!user || !isAdmin(user)) {
    return (
      <ProtectedRoute>
        <Layout>
          <div style={{ padding: 20, color: '#fff' }}>
            Sem acesso
          </div>
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
                <option value="user">user</option>
                <option value="supervisor">supervisor</option>
                <option value="admin">admin</option>
              </select>
            </div>
          ))}

          <h2 style={{ marginTop: 20 }}>Logs</h2>

          {logs.map(l => (
            <div key={l.id}>
              <p style={{ color: '#f5c400' }}>{l.action}</p>
              <p>{l.description}</p>
            </div>
          ))}

        </div>

      </Layout>
    </ProtectedRoute>
  );
}
