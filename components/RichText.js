export default function RichText({ value, onChange }) {

  const renderContent = (text) => {
    if (!text) return null;

    const lines = text.split('\n');

    return lines.map((line, index) => {

      const isNetworkPath = line.trim().startsWith('\\\\');

      if (isNetworkPath) {

        const normalized = line
          .trim()
          .replace(/\\/g, '/');

        const href = `file://///${normalized.replace(/^\/+/, '')}`;

        return (
          <div key={index}>
            📎{" "}
            <a
              href={href}
              style={{
                color: '#3b82f6',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                // ajuda alguns browsers corporativos
                e.preventDefault();
                window.location.href = href;
              }}
            >
              {line.trim()}
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
