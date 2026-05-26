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

      const { data: createdUser, error: authError } =
        await supabase.auth.signUp({
          email: newEmail,
          password: newPassword
        });

      if (authError) {
        setLoading(false);
        return alert(authError.message);
      }

      const uid = createdUser?.user?.id;

      if (!uid) {
        setLoading(false);
        return alert('Usuário não criado');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: uid,
          email: newEmail,
          role: newRole
        });

      if (profileError) {
        setLoading(false);
        return alert(profileError.message);
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
    const confirmar = confirm(
      `Excluir usuário?\n\n${email}`
    );

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

        <div style={styles.header}>
          <h1 style={styles.title}>
            Usuários
          </h1>
        </div>

        {/* CREATE USER */}
        <div style={styles.card}>

          <h2 style={styles.subtitle}>
            Novo Usuário
          </h2>

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
              <option value="user">
                user
              </option>

              <option value="supervisor">
                supervisor
              </option>
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

        {/* USERS */}
        <div style={styles.card}>

          <h2 style={styles.subtitle}>
            Usuários Cadastrados
          </h2>

          <div style={styles.userList}>

            {users.map(u => (
              <div
                key={u.id}
                style={styles.userCard}
              >

                <div style={styles.userTop}>

                  <div>
                    <p style={styles.email}>
                      {u.email}
                    </p>

                    <p style={styles.role}>
                      {u.role}
                    </p>
                  </div>

                  <button
                    style={styles.deleteBtn}
                    onClick={() =>
                      deleteUser(u.id, u.email)
                    }
                  >
                    excluir
                  </button>

                </div>

              </div>
            ))}

          </div>

        </div>

      </div>

    </Layout>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10
  },

  title: {
    color: '#fff',
    margin: 0
  },

  subtitle: {
    color: '#FFD600',
    marginTop: 0
  },

  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 18,
    padding: 20
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },

  input: {
    background: '#0b0b0b',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    outline: 'none'
  },

  mainBtn: {
    background: '#FFD600',
    color: '#000',
    border: 'none',
    borderRadius: 12,
    padding: '12px 18px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  deleteBtn: {
    background: 'transparent',
    border: '1px solid #ff4d4d',
    color: '#ff4d4d',
    padding: '10px 14px',
    borderRadius: 10,
    cursor: 'pointer'
  },

  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },

  userCard: {
    padding: 16,
    borderRadius: 14,
    background: '#0d0d0d',
    border: '1px solid #222'
  },

  userTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap'
  },

  email: {
    color: '#fff',
    margin: 0,
    fontWeight: 'bold'
  },

  role: {
    color: '#FFD600',
    marginTop: 8,
    marginBottom: 0
  }
};
