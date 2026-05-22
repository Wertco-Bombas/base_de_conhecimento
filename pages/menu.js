import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Menu() {
  return (
    <ProtectedRoute>
      <Layout>

        <div style={styles.container}>

          <h1 style={styles.title}>Dashboard</h1>

          <div style={styles.box}>
            <p>Bem-vindo ao sistema.</p>
            <p>Aqui aparecerão avisos, métricas e notificações futuras.</p>
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

  box: {
    marginTop: 20,
    padding: 20,
    background: '#111',
    borderRadius: 10,
    border: '1px solid #222'
  }
};
