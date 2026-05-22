import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Menu() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <Layout>

        <div style={styles.container}>
          <h1 style={styles.title}>Menu</h1>

          <div style={styles.grid}>

            <button onClick={() => router.push('/base')} style={styles.btn}>
              Base de Conhecimento
            </button>

            <button onClick={() => router.push('/admin')} style={styles.btn}>
              Usuários / Admin
            </button>

            <button onClick={() => router.push('/auditoria')} style={styles.btn}>
              Auditoria
            </button>

            <button onClick={() => router.push('/treinamento')} style={styles.btn}>
              Treinamento
            </button>

          </div>
        </div>

      </Layout>
    </ProtectedRoute>
  );
}

const styles = {
  container: {
    padding: 20,
    color: '#fff'
  },

  title: {
    color: '#f5c400'
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 10,
    marginTop: 20
  },

  btn: {
    padding: 15,
    background: '#f5c400',
    border: 0,
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};
