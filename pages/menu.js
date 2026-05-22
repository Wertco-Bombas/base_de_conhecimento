import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { useRouter } from 'next/router';

export default function Menu() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <Layout>
        <h1 style={{ color: '#f5c400' }}>Menu</h1>

        <div style={styles.grid}>
          <button onClick={() => router.push('/base')} style={styles.btn}>Base de Conhecimento</button>
          <button onClick={() => router.push('/usuarios')} style={styles.btn}>Usuários</button>
          <button onClick={() => router.push('/auditoria')} style={styles.btn}>Auditoria</button>
          <button onClick={() => router.push('/treinamento')} style={styles.btn}>Treinamento</button>
          <button onClick={() => router.push('/informacao')} style={styles.btn}>Informação</button>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
    marginTop: '20px'
  },
  btn: {
    padding: '20px',
    background: '#1a1a1a',
    color: '#f5c400',
    border: '1px solid #333',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px'
  }
};
