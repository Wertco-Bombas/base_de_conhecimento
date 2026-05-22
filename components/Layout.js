export default function Layout({ children }) {
  return (
    <div style={styles.wrapper}>
      {children}
    </div>
  );
}

const styles = {
  wrapper: {
    width: '100vw',
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column'
  }
};
