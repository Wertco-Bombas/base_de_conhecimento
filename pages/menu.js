import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Menu() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  }

  function go(path) {
    router.push(path);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div style={styles.container}>

          <h1 style={styles.title}>Menu</h1>

                   <div style={styles.grid}>

            <button onClick={() => go('/base')} style={styles.btn}>
              Base de Conhecimento
            </button>

            <button onClick={() => go('/admin')} style={styles.btn}>
              Usuários / Admin
            </button>

          </div>

        </div>
      </Layout>
    </ProtectedRoute>
  );
}

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    padding: 20,
    background: '#0a0a0a',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column'
  },

  title: { color: '#f5c400' },

  user: { color: '#aaa' },

  grid: {
    marginTop: 30,
    display: 'grid',
    gap: 10,
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
  },

  btn: {
    padding: 15,
    background: '#f5c400',
    border: 0,
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  logout: {
    padding: 15,
    background: '#222',
    color: '#f5c400',
    border: '1px solid #333',
    borderRadius: 10,
    cursor: 'pointer'
  }
};
