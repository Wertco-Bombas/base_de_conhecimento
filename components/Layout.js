import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      setLoading(true);

      try {
        const { data: auth } = await supabase.auth.getUser();

        if (!auth?.user) {
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, email')
          .eq('id', auth.user.id)
          .maybeSingle();

        if (isMounted) {
          setUser({
            id: auth.user.id,
            email: auth.user.email,
            role: profile?.role || 'user'
          });

          setLoading(false);
        }

      } catch (err) {
        console.error('Erro loadUser:', err);

        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  async function logout() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      window.location.href = '/';
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={styles.wrapper}>

      {/* SIDEBAR */}
      <div className="sidebar-hover" style={styles.sidebar}>
        <div style={styles.brand}>
  <img
    src="/logo_app.jpg"
    alt="Logo"
    className="logo-sidebar"
  />
</div>

        {!loading && user && (
          <div style={styles.menu}>

            <a style={styles.link} href="/base">
  <span style={{ fontSize: 18, minWidth: 24, textAlign: 'center' }}>📚</span>
  <span className="menu-text">Base de Conhecimento</span>
</a>

           <a style={styles.link} href="/approval">
  <span style={{ fontSize: 18, minWidth: 24, textAlign: 'center' }}>✅</span>
  <span className="menu-text">Aprovação</span>
</a>

          <a style={styles.link} href="/usuarios">
  <span style={{ fontSize: 18, minWidth: 24, textAlign: 'center' }}>👥</span>
  <span className="menu-text">Usuários</span>
</a>

          </div>
        )}

        <div style={styles.bottom}>
          <div style={styles.user}>
            👤 {user?.email || 'Não logado'}
          </div>

          <div style={styles.role}>
            {user?.role ? `(${user.role})` : ''}
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
    width: '100%',
    background: '#0b0b0b',
    color: '#fff',
    fontFamily: 'Arial'
  },

sidebar: {
  background: '#111',
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 15,
  borderRight: '1px solid #222',
  position: 'sticky',
  top: 0,
  height: '100vh',
  overflow: 'hidden',
  transition: 'width 0.25s ease'
},

  brand: {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 20,
  minHeight: 50
},

  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },

 link: {
  color: '#fff',
  textDecoration: 'none',
  padding: 10,
  borderRadius: 8,
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  whiteSpace: 'nowrap'
},

  content: {
    flex: 1,
    padding: 20
  },

  bottom: {
    marginTop: 'auto',
    borderTop: '1px solid #222',
    paddingTop: 15
  },

  user: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4
  },

  role: {
    fontSize: 11,
    color: '#FFD600',
    marginBottom: 10
  },

  logout: {
    padding: 10,
    width: '100%',
    background: '#222',
    color: '#fff',
    border: '1px solid #333',
    cursor: 'pointer',
    borderRadius: 8
  }
};
