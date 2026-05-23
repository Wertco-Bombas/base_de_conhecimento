import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { canApprove, isAdmin } from '../lib/permissions';

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [checkedPending, setCheckedPending] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
  }, []);

  useEffect(() => {

    async function checkPending() {

      if (!user) return;
      if (checkedPending) return;

      if (!canApprove(user)) return;

      const { data: topics } = await supabase
        .from('topicos')
        .select('id')
        .eq('status', 'pending');

      const { data: comments } = await supabase
        .from('comentarios')
        .select('id')
        .eq('status', 'pending');

      const total = (topics?.length || 0) + (comments?.length || 0);

      if (total > 0) {

        const go = confirm(
          `🔔 Pendências de aprovação:\n\n` +
          `Tópicos: ${topics?.length || 0}\n` +
          `Comentários: ${comments?.length || 0}\n\n` +
          `Ir para aprovação?`
        );

        if (go) {
          window.location.href = '/approval';
        }
      }

      setCheckedPending(true);
    }

    checkPending();

  }, [user]);

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

        {/* supervisor/admin */}
        {user && (user.role === 'supervisor' || user.role === 'admin') && (
          <a href="/approval">✅ Aprovação</a>
        )}

        {/* admin only */}
        {user && user.role === 'admin' && (
          <a href="/admin">👥 Usuários</a>
        )}

        <div style={styles.bottom}>
          <div style={styles.user}>
            👤 {user?.email || 'Não logado'}
            <br />
            <span style={{ fontSize: 11, color: '#f5c400' }}>
              {user?.role || ''}
            </span>
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
