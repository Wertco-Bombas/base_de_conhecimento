import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Layout({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div style={styles.wrapper}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.brand}>WERTCO</div>

        <a href="/base">📚 Base</a>

        <div style={styles.bottom}>
          <div style={styles.user}>
            👤 {user?.email || 'Não logado'}
          </div>

          <button onClick={logout} style={styles.logout}>
            Sair
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={styles.content}>
        {children}
      </div>

    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0b0b0b',
    color: '#fff',
    fontFamily: 'Arial'
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
    fontSize: 20,
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
  },

  user: {
    fontSize: 12,
    marginBottom: 10,
    color: '#aaa'
  },

  logout: {
    padding: 8,
    width: '100%',
    background: '#222',
    color: '#fff',
    border: '1px solid #333',
    cursor: 'pointer'
  }
};
