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
    background: '#000',
    color: '#fff',
    display: 'flex'
  },
  content: {
    flex: 1,
    padding: 20
  }
};
