import { supabase } from '../lib/supabaseClient';

export default function Layout({ children }) {
  return (
    <div style={styles.wrapper}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.brand}>WERTCO</div>

        <a href="/base">📚 Base</a>
        <a href="/admin">⚙ Admin</a>
        <a href="/auditoria">📊 Auditoria</a>

        <div style={styles.bottom}>
          <UserBox />
        </div>
      </div>

      {/* CONTENT */}
      <div style={styles.content}>
        {children}
      </div>

    </div>
  );
}

function UserBox() {
  const user = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || 'null')
    : null;

  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  return (
    <div>
      <p style={{ fontSize: 12 }}>{user?.email}</p>
      <button onClick={logout}>Sair</button>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0b0b0b',
    color: '#fff'
  },

  sidebar: {
    width: 240,
    background: '#111',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },

  brand: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f5c400',
    marginBottom: 20
  },

  content: {
    flex: 1,
    padding: 20
  },

  bottom: {
    marginTop: 'auto'
  }
};
