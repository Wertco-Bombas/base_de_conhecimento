export default function RichText({ value, onChange }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={styles.editor}
      placeholder="Escreva seu conteúdo..."
    />
  );
}

const styles = {
  editor: {
    width: '100%',
    minHeight: 120,
    padding: 10,
    background: '#111',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: 8
  }
};
