import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: topics } = await supabase.from('topicos').select('*');
    const { data: comments } = await supabase.from('comentarios').select('*');
    const { data: users } = await supabase.from('profiles').select('*');

    setStats({
      topics: topics.length,
      comments: comments.length,
      users: users.length
    });
  }

  return (
    <Layout>
      <div style={{ padding: 20, color: '#fff' }}>

        <h1 style={{ color: '#f5c400' }}>Dashboard</h1>

        <div style={styles.grid}>

          <div style={styles.card}>
            Tópicos: {stats.topics}
          </div>

          <div style={styles.card}>
            Comentários: {stats.comments}
          </div>

          <div style={styles.card}>
            Usuários: {stats.users}
          </div>

        </div>

      </div>
    </Layout>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10
  },

  card: {
    background: '#111',
    padding: 20,
    borderRadius: 10,
    textAlign: 'center'
  }
};
