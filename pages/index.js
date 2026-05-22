import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    topics: 0,
    comments: 0,
    categories: 0
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const users = await supabase.from('profiles').select('*', { count: 'exact' });
    const topics = await supabase.from('topicos').select('*', { count: 'exact' });
    const comments = await supabase.from('comentarios').select('*', { count: 'exact' });
    const categories = await supabase.from('categorias').select('*', { count: 'exact' });

    setStats({
      users: users.count || 0,
      topics: topics.count || 0,
      comments: comments.count || 0,
      categories: categories.count || 0
    });
  }

  return (
    <ProtectedRoute>
      <Layout>

        <div style={styles.container}>

          <h1 style={styles.title}>Dashboard</h1>

          <div style={styles.grid}>

            <div style={styles.card}>
              <h2>Usuários</h2>
              <p style={styles.number}>{stats.users}</p>
            </div>

            <div style={styles.card}>
              <h2>Tópicos</h2>
              <p style={styles.number}>{stats.topics}</p>
            </div>

            <div style={styles.card}>
              <h2>Comentários</h2>
              <p style={styles.number}>{stats.comments}</p>
            </div>

            <div style={styles.card}>
              <h2>Categorias</h2>
              <p style={styles.number}>{stats.categories}</p>
            </div>

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
    background: '#0a0a0a',
    color: '#fff'
  },

  title: {
    color: '#f5c400',
    marginBottom: 20
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 15
  },

  card: {
    background: '#111',
    padding: 20,
    borderRadius: 12,
    border: '1px solid #222',
    transition: '0.2s'
  },

  number: {
    fontSize: 32,
    color: '#f5c400',
    fontWeight: 'bold'
  }
};
