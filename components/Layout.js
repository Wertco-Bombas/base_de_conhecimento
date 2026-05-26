import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      setLoading(true);

      // 🔥 CORREÇÃO PRINCIPAL: usar getSession (mais estável)
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const authUser = session?.user;

      if (!authUser) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', authUser.id)
        .maybeSingle();

      if (isMounted) {
        setUser({
          id: authUser.id,
          email: authUser.email,
          role: profile?.role || 'user'
        });

        setLoading(false);
      }
    }

    loadUser();

    // 🔥 listener de auth (evita estado quebrado)
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }

      if (event === 'SIGNED_IN') {
        loadUser();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    try {
      setLoading(true);

      setUser(null);

      await supabase.auth.signOut();

      // 🔥 limpeza segura (evita sessão fantasma)
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}

      // redirecionamento limpo
      window.location.href = '/';
    } catch (err) {
      console.error('Erro logout:', err);
    } finally {
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
      <div style={styles.content}>{children}</div>
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
