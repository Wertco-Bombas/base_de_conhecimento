import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div style={styles.nav}>
      <div style={styles.left}>⚡ Sistema</div>

      <div style={styles.right}>
        {user && <span style={styles.user}>{user.email}</span>}
        <button style={styles.btn} onClick={() => router.push('/menu')}>
          Menu
        </button>
        <button style={styles.logout} onClick={logout}>
          Sair
        </button>
      </div>
    </div>
  );
}

const styles = {
  nav: {
    background: '#0d0d0d',
    borderBottom: '1px solid #222',
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#fff'
  },
  left: {
    color: '#f5c400',
    fontWeight: 'bold'
  },
  right: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  user: {
    color: '#ccc',
    marginRight: '10px'
  },
  btn: {
    background: '#f5c400',
    border: 'none',
    padding: '8px 12px',
    cursor: 'pointer',
    borderRadius: '6px',
    fontWeight: 'bold'
  },
  logout: {
    background: '#333',
    color: '#fff',
    border: '1px solid #555',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer'
  }
};
