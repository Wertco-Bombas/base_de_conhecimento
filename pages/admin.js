import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';

import { getCurrentUser } from '../lib/auth';
import { isAdmin } from '../lib/permissions';

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const u = await getCurrentUser();
    setUser(u);

    if (!isAdmin(u)) {
      alert('Acesso negado');
      window.location.href = '/base';
      return;
    }

    fetchUsers();
    fetchLogs();
  }

  /* =========================
     USERS
  ========================== */
  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('*');
    setUsers(data || []);
  }

  async function updateRole(id, role) {
    await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id);

    fetchUsers();
  }

  /* =========================
     AUDIT LOG
  ========================== */
  async function fetchLogs() {
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false });

    setLogs(data || []);
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div style={styles.container}>

          <h1 style={styles.title}>Painel Admin</h1>

          {/* USERS */}
          <h2 style={styles.subtitle}>Usuários</h2>

          <div style={styles.grid}>
            {users.map((u) => (
              <div key={u.id} style={styles.card}>

                <p><b>Email:</b> {u.email}</p>

                <p><b>Role:</b> {u.role}</p>

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

          {/* AUDIT */}
          <h2 style={styles.subtitle}>Auditoria</h2>

          <div style={styles.audit}>
            {logs.map((l) => (
              <div key={l.id} style={styles.log}>

                <p style={{ color: '#f5c400' }}>
                  {l.action}
                </p>

                <p style={{ fontSize: 12, color: '#aaa' }}>
                  {l.description}
                </p>

                <p style={{ fontSize: 11, color: '#666' }}>
                  {new Date(l.created_at).toLocaleString()}
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
   STYLE (PRETO + AMARELO)
========================= */
const styles = {
  container: {
    padding: '20px',
    color: '#fff'
  },

  title: {
    color: '#f5c400'
  },

  subtitle: {
    marginTop: '20px',
    color: '#fff'
  },

  grid: {
    display: 'grid',
    gap: '10px',
    marginTop: '10px'
  },

  card: {
    background: '#1a1a1a',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid #222'
  },

  select: {
    marginTop: '10px',
    width: '100%',
    padding: '8px',
    borderRadius: '8px',
    background: '#111',
    color: '#fff',
    border: '1px solid #333'
  },

  audit: {
    marginTop: '10px',
    display: 'grid',
    gap: '10px'
  },

  log: {
    background: '#111',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #222'
  }
};
