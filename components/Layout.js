import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh', color: '#fff' }}>
      <Navbar />
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}
