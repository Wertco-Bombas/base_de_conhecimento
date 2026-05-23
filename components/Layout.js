import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div style={styles.container}>

      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>KB</h2>

        <Link href="/base">📚 Base de Conhecimento</Link>
        <Link href="/menu">🏠 Menu</Link>
        <Link href="/approval">✅ Aprovações</Link>
        <Link href="/auditoria">📊 Auditoria</Link>
      </aside>

      <main style={styles.main}>
        {children}
      </main>

    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0b0b0b',
    color: '#fff'
  },
  sidebar: {
    width: 220,
    padding: 20,
    background: '#111',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  main: {
    flex: 1,
    padding: 20
  },
  logo: {
    color: '#f5c400'
  }
};
