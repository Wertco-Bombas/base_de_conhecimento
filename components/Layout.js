import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Layout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <div style={styles.wrapper}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>WERTCO</h2>

        <button onClick={() => router.push('/menu')} style={styles.link}>
          Menu
        </button>

        <button onClick={() => router.push('/base')} style={styles.link}>
          Base
        </button>

        <button onClick={() => router.push('/admin')} style={styles.link}>
          Admin
        </button>
      </div>

      {/* MAIN */}
      <div style={styles.main}>

        {/* TOPBAR */}
        <div style={styles.topbar}>

          <div style={styles.user}>
            {user ? user.email : 'Carregando...'}
          </div>

          <button onClick={logout} style={styles.logout}>
            Sair
          </button>

        </div>

        {/* CONTENT */}
        <div style={styles.content}>
          {children}
        </div>

      </div>

    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    background: '#0a0a0a',
    color: '#fff'
  },

  sidebar: {
    width: '220px',
    background: '#111',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },

  logo: {
    color: '#f5c400',
    marginBottom: '20px'
  },

  link: {
    padding: '10px',
    background: 'transparent',
    border: '1px solid #333',
    color: '#fff',
    cursor: 'pointer',
    borderRadius: '8px',
    textAlign: 'left'
  },

  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },

  topbar: {
    height: '60px',
    background: '#111',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    borderBottom: '1px solid #222'
  },

  user: {
    color: '#aaa'
  },

  logout: {
    background: '#f5c400',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  content: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto'
  }
};
