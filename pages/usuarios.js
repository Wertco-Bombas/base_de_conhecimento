import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Usuarios() {
  const [users, setUsers] = useState([]);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('email');

    if (!error) {
      setUsers(data || []);
    }
  }

  async function createUser() {
    if (!newEmail || !newPassword) {
      return alert('Preencha email e senha');
    }

    try {
      setLoading(true);

      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        return alert(data.error);
      }

      setNewEmail('');
      setNewPassword('');
      setNewRole('user');

      await load();

      setLoading(false);

      alert('Usuário criado com sucesso');

    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('Erro ao criar usuário');
    }
  }

  async function deleteUser(userId, email) {
    const confirmar = confirm(`Excluir usuário?\n\n${email}`);
    if (!confirmar) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        setLoading(false);
        return alert(error.message);
      }

      await load();

      setLoading(false);

      alert('Usuário removido');

    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('Erro ao excluir usuário');
    }
  }

  return (
    <Layout>
      <div style={styles.wrapper}>

        <h1 style={styles.title}>Usuários</h1>

        <div style={styles.card}>
          <h2 style={styles.subtitle}>Novo Usuário</h2>

          <div style={styles.form}>
            <input
              style={styles.input}
              placeholder="Email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
            />

            <input
              style={styles.input}
              type="password"
              placeholder="Senha"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />

            <select
              style={styles.input}
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
            >
              <option value="user">user</option>
              <option value="supervisor">supervisor</option>
            </select>

            <button
              style={styles.mainBtn}
              onClick={createUser}
              disabled={loading}
            >
              {loading ? 'criando...' : 'Criar Usuário'}
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.subtitle}>Usuários</h2>

          {users.map(u => (
            <div key={u.id} style={styles.userCard}>
              <div>
                <p style={styles.email}>{u.email}</p>
                <p style={styles.role}>{u.role}</p>
              </div>

              <button
                style={styles.deleteBtn}
                onClick={() => deleteUser(u.id, u.email)}
              >
                excluir
              </button>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: 20 },
  title: { color: '#fff' },
  subtitle: { color: '#FFD600' },

  card: {
    background: '#111',
    padding: 20,
    borderRadius: 18,
    border: '1px solid #222'
  },

  form: { display: 'flex', flexDirection: 'column', gap: 12 },

  input: {
    padding: 12,
    borderRadius: 10,
    border: '1px solid #333',
    background: '#0b0b0b',
    color: '#fff'
  },

  mainBtn: {
    background: '#FFD600',
    border: 'none',
    padding: 12,
    borderRadius: 10,
    cursor: 'pointer'
  },

  userCard: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 12,
    borderBottom: '1px solid #222'
  },

  email: { color: '#fff', margin: 0 },
  role: { color: '#FFD600', margin: 0 },

  deleteBtn: {
    background: 'transparent',
    border: '1px solid red',
    color: 'red',
    padding: 8,
    borderRadius: 8,
    cursor: 'pointer'
  }
};
