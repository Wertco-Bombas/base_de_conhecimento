import Link from 'next/link';
import useUser from '../lib/useUser';

export default function Navbar() {
  const user = useUser();

  return (
    <div style={styles.nav}>
      <h3 style={{ color: '#f5c400' }}>Sistema</h3>

      <Link href="/menu">Menu</Link>
      <Link href="/base">Base</Link>

      {(user?.role === 'admin' || user?.role === 'supervisor') && (
        <Link href="/admin">Admin</Link>
      )}

      <div style={{ marginTop: 'auto' }}>
        {user && (
          <p style={{ fontSize: 12 }}>
            {user.name || user.email}
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  nav: {
    width: 200,
    background: '#111',
    padding: 15,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  }
};
