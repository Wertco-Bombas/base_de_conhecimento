import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';

import useUser from '../lib/useUser';
import { canEdit } from '../lib/permissions';

export default function AdminPanel() {
  const user = useUser();

  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    if (!canEdit(user)) {
      window.location.href = '/menu';
      return;
    }

    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);

    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: logsData } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false });

    setUsers(usersData || []);
    setLogs(logsData || []);

    setLoading(false);
  }

  async function updateRole(id, role) {
    await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id);

    loadData();
  }

  if (!user) {
    return (
      <ProtectedRoute>
        <Layout>
          <p style={{ color: '#fff' }}>Carregando...</p>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!canEdit(user)) {
    return (
      <ProtectedRoute>
        <Layout>
          <p style={{ color: '#fff' }}>Sem permissão de acesso</p>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>

        <div style={styles.container}>

          <h1 style={styles.title}>Painel Admin</h1>

          {/* USERS */}
          <h2 style={styles.subtitle}>Usuários</h2>

          {loading && <p>Carregando usuários...</p>}

          <div style={styles.grid}>
            {users.map((u) => (
              <div key={u.id} style={styles.card}>

                <p><b>Email:</b> {u.email}</p>

                <p><b>Role atual:</b> {u.role}</p>

                <select
                  value={u.role}
                  onChange={(e) => updateRole(u.id, e.target.value)}
                  style={styles.select}
                >
                  <option value="user">user</option>
                  <option value="supervisor">supervisor</option>
                  <option value="admin">admin</option>
                </select>

              </div>
            ))}
          </div>

          {/* LOGS */}
          <h2 style={styles.subtitle}>Auditoria</h2>

          <div style={styles.logs}>
            {logs.map((l) => (
              <div key={l.id} style={styles.logCard}>

                <p style={{ color: '#f5c400', fontWeight: 'bold' }}>
                  {l.action}
                </p>

                <p style={{ color: '#aaa' }}>
                  {l.description}
                </p>

                <p style={{ fontSize: 11, color: '#666' }}>
                  {l.created_at
                    ? new Date(l.created_at).toLocaleString()
                    : ''}
                </p>

              </div>
            ))}
          </div>

        </div>

      </Layout>
    </ProtectedRoute>
  );
}

/* =========================
   STYLES (PRETO + AMARELO)
========================= */

const styles = {
  container: {
    padding: 20,
    color: '#fff'
  },

  title: {
    color: '#f5c400',
    marginBottom: 20
  },

  subtitle: {
    marginTop: 20,
    marginBottom: 10,
    color: '#fff'
  },

  grid: {
    display: 'grid',
    gap: 10
  },

  card: {
    background: '#111',
    padding: 15,
    borderRadius: 10,
    border: '1px solid #222'
  },

  select: {
    marginTop: 10,
    width: '100%',
    padding: 8,
    borderRadius: 6,
    background: '#000',
    color: '#fff',
    border: '1px solid #333'
  },

  logs: {
    display: 'grid',
    gap: 10
  },

  logCard: {
    background: '#0a0a0a',
    padding: 12,
    borderRadius: 8,
    border: '1px solid #222'
  }
};
