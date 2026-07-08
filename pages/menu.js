import Link from 'next/link';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import useUser from '../lib/useUser';

export default function Menu() {
  const user = useUser();

  return (
    <ProtectedRoute>
      <Layout>

        <div style={styles.container}>

          {/* HEADER */}
          <div style={styles.header}>
            <h1 style={styles.title}>Menu</h1>

            {user && (
              <div style={styles.userBox}>
                <p style={styles.userName}>
                  {user.name || 'Sem nome'}
                </p>
                <p style={styles.userEmail}>
                  {user.email}
                </p>
                <p style={styles.role}>
                  {user.role}
                </p>
              </div>
            )}
          </div>

          {/* GRID MENU */}
          <div style={styles.grid}>

            <Link href="/base" style={styles.card}>
              📚 Base de Conhecimento
            </Link>

            <Link href="/treinamento" style={styles.card}>
              🎓 Treinamento
            </Link>

            {(user?.role === 'admin' || user?.role === 'supervisor') && (
              <Link href="/admin" style={styles.card}>
                👥 Usuários
              </Link>
             <Link href="/instrucoes">
    Instruções de Trabalho
</Link>
            )}

           

          </div>

          {/* INFO BOX */}
          <div style={styles.info}>
            Sistema interno de gestão de conhecimento
          </div>

        </div>

      </Layout>
    </ProtectedRoute>
  );
}

/* =========================
   STYLES (DASHBOARD MODERNO)
========================= */

const styles = {
  container: {
    padding: 20,
    color: '#fff'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30
  },

  title: {
    color: '#f5c400'
  },

  userBox: {
    textAlign: 'right',
    background: '#111',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #222'
  },

  userName: {
    fontWeight: 'bold',
    color: '#fff',
    margin: 0
  },

  userEmail: {
    fontSize: 12,
    color: '#aaa',
    margin: 0
  },

  role: {
    fontSize: 11,
    color: '#f5c400',
    margin: 0
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 15
  },

  card: {
    background: '#111',
    padding: 20,
    borderRadius: 10,
    textDecoration: 'none',
    color: '#fff',
    border: '1px solid #222',
    transition: '0.2s'
  },

  info: {
    marginTop: 30,
    color: '#777',
    fontSize: 12
  }
};
