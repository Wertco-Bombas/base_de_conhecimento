import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Admin() {

  const [users, setUsers] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    setUsers(data || []);
  }

  async function updateRole(id, role) {

    await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id);

    load();
  }

  async function createUser() {

    const email = prompt('Email');
    const role = prompt('Role (user/supervisor/admin)');

    await supabase
      .from('profiles')
      .insert({ email, role });

    load();
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>

      <Layout>

        <div style={styles.page}>

          <h1 style={styles.title}>Admin Users</h1>

          <button style={styles.createBtn} onClick={createUser}>
            Criar usuário
          </button>

          <div style={styles.list}>

            {users.map(u => (
              <div key={u.id} style={styles.card}>

                <div style={styles.info}>
                  <p style={styles.email}>{u.email}</p>
                  <span style={styles.role}>{u.role}</span>
                </div>

                <div style={styles.actions}>

                  <button
                    style={styles.btn}
                    onClick={() => updateRole(u.id, 'user')}
                  >
                    user
                  </button>

                  <button
                    style={styles.btn}
                    onClick={() => updateRole(u.id, 'supervisor')}
                  >
                    supervisor
                  </button>

                  <button
                    style={styles.btnDanger}
                    onClick={() => updateRole(u.id, 'admin')}
                  >
                    admin
                  </button>

                </div>

              </div>
            ))}

          </div>

        </div>

      </Layout>

    </ProtectedRoute>
  );
}

const styles = {

  page: {
    padding: 10,
    color: '#fff'
  },

  title: {
    color: '#FFD600',
    marginBottom: 20
  },

  createBtn: {
    background: '#FFD600',
    border: 'none',
    padding: '10px 14px',
    borderRadius: 10,
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: 20
  },

  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },

  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 14,
    padding: 14,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  info: {
    display: 'flex',
    flexDirection: 'column'
  },

  email: {
    margin: 0,
    fontSize: 14
  },

  role: {
    fontSize: 12,
    color: '#FFD600',
    marginTop: 4
  },

  actions: {
    display: 'flex',
    gap: 8
  },

  btn: {
    background: '#222',
    border: '1px solid #333',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'pointer'
  },

  btnDanger: {
    background: '#FFD600',
    border: 'none',
    color: '#000',
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};
