export default function RichText({ value, onChange }) {

  const isNetworkPath = (text) => {
    return text && text.trim().startsWith('\\\\');
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Caminho copiado. Cole no Explorer.');
  };

  const handleOpen = (text) => {
    const fixed = text
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\/\//, '');

    const url = `file://///${fixed}`;

    window.location.href = url;
  };

  const renderPreview = (text) => {
    if (!text) return null;

    const lines = text.split('\n');

    return lines.map((line, index) => {

      if (isNetworkPath(line)) {
        const clean = line.trim();

        return (
          <div key={index} style={{ marginBottom: 8 }}>
            📎 <span style={{ color: '#fff' }}>{clean}</span>

            <div style={{ marginTop: 4, display: 'flex', gap: 10 }}>
              
              <button
                onClick={() => handleOpen(clean)}
                style={styles.linkButton}
              >
                Abrir
              </button>

              <button
                onClick={() => handleCopy(clean)}
                style={styles.copyButton}
              >
                Copiar
              </button>

            </div>
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
        {renderPreview(value)}
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
    whiteSpace: 'pre-wrap'
  },

  linkButton: {
    background: 'transparent',
    border: '1px solid #3b82f6',
    color: '#3b82f6',
    padding: '4px 8px',
    cursor: 'pointer',
    borderRadius: 4
  },

  copyButton: {
    background: 'transparent',
    border: '1px solid #999',
    color: '#999',
    padding: '4px 8px',
    cursor: 'pointer',
    borderRadius: 4
  }
};
