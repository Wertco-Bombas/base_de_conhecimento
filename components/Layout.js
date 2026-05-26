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

    // 🔥 garante sincronização real de login/logout
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    try {
      setLoading(true);

      setUser(null);

      // força logout global no Supabase
      await supabase.auth.signOut({ scope: 'global' });

      // limpa cache local (importante em alguns casos)
      try {
        localStorage.clear();
      } catch (e) {}

      // evita loop de reload
      window.location.replace('/');
    } catch (err) {
      console.error('Erro logout:', err);
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.brand}>WERTCO</div>

        {!loading && user && (
          <div style={styles.menu}>
            <a style={styles.link} href="/base">
              📚 Base de Conhecimento
            </a>

            {(user.role === 'supervisor' || user.role === 'admin') && (
              <a style={styles.link} href="/approval">
                ✅ Aprovação
              </a>
            )}

            {user.role === 'admin' && (
              <a style={styles.link} href="/usuarios">
                👥 Usuários
              </a>
            )}
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
    width: 260,
    background: '#111',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
    borderRight: '1px solid #222'
  },

  brand: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f5c400',
    marginBottom: 20
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
    fontSize: 14
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
    color: '#f5c400',
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
