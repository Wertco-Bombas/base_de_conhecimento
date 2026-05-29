export default function RichText({ value, onChange }) {

  const renderContent = (text) => {
    if (!text) return null;

    // Divide por linhas para manter estrutura
    const lines = text.split('\n');

    return lines.map((line, index) => {

      const match = line.match(/\\\\.*$/);

      if (match) {
        const path = match[0];

        const normalized = path.replace(/\\/g, '/');
        const href = `file:///${normalized}`;

        return (
          <div key={index}>
            📎{" "}
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#3b82f6',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              {path}
            </a>
          </div>
        );
      }

      return <div key={index}>{line}</div>;
    });
  };

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.editor}
        placeholder="Escreva seu conteúdo..."
      />

      <div style={styles.previewTitle}>
        Pré-visualização
      </div>

      <div style={styles.preview}>
        {renderContent(value)}
      </div>
    </div>
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
  },

  previewTitle: {
    marginTop: 12,
    marginBottom: 6,
    color: '#999',
    fontSize: 14
  },

  preview: {
    padding: 12,
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#fff',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  }
};
