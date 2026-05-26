import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        router.replace('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      setUser({
        id: data.user.id,
        email: data.user.email,
        role: profile?.role || 'user'
      });
    }

    load();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  if (!user) return null;

  return (
    <div style={styles.wrapper}>
      <div style={styles.sidebar}>
        <h2>WERTCO</h2>

        <a href="/base">Base</a>

        {(user.role === 'admin' || user.role === 'supervisor') && (
          <a href="/approval">Aprovação</a>
        )}

        {user.role === 'admin' && (
          <a href="/usuarios">Usuários</a>
        )}

        <button onClick={logout}>Sair</button>
      </div>

      <div style={styles.content}>{children}</div>
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
    padding: 20,
    background: '#111',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  content: {
    flex: 1,
    padding: 20
  }
};
