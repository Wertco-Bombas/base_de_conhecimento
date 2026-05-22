import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.content}>{children}</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    width: '100vw',
    background: '#000',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    margin: 0,
    padding: 0,
    overflow: 'hidden'
  },

  content: {
    flex: 1,
    width: '100%',
    margin: 0,
    padding: 0, // 👈 removido o espaço que criava “moldura”
    overflow: 'auto'
  }
};
