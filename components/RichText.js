export default function RichText({ value, onChange }) {

  const isNetworkPath = (line) => {
    return line && line.trim().startsWith('\\\\');
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Caminho copiado. Cole no Explorer.');
  };

  const handleOpen = (text) => {
    // mantém UNC original funcionando no Windows Explorer
    const clean = text.trim();

    // abre diretamente via Explorer (mais confiável que file://)
    window.open(`file:///${clean.replace(/\\/g, '/')}`, '_blank');
  };

  const renderPreview = (text) => {
    if (!text) return null;

    const lines = text.split('\n');

    return lines.map((line, index) => {

      if (isNetworkPath(line)) {
        const clean = line.trim();

        return (
          <div key={index} style={{ marginBottom: 10 }}>
            <div style={{ color: '#fff' }}>
              📎 {clean}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => handleOpen(clean)}
                style={styles.openBtn}
              >
                Abrir
              </button>

              <button
                onClick={() => handleCopy(clean)}
                style={styles.copyBtn}
              >
                Copiar
              </button>
            </div>
          </div>
        );
      }

      return (
        <div key={index} style={{ marginBottom: 4 }}>
          {line}
        </div>
      );
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

  openBtn: {
    background: 'transparent',
    border: '1px solid #3b82f6',
    color: '#3b82f6',
    padding: '4px 8px',
    cursor: 'pointer',
    borderRadius: 4
  },

  copyBtn: {
    background: 'transparent',
    border: '1px solid #999',
    color: '#999',
    padding: '4px 8px',
    cursor: 'pointer',
    borderRadius: 4
  }
};
