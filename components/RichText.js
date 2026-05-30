export default function RichText({ value, onChange }) {

  const isNetworkPath = (line) => {
    return line && line.trim().startsWith('\\\\');
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Caminho copiado. Cole no Explorer.');
  };

  const handleOpen = (text) => {
    const clean = text.trim();
    window.open(`file:///${clean.replace(/\\/g, '/')}`, '_blank');
  };

  const renderTextWithLinks = (text) => {
    if (!text) return text;

    const parts = text.split(/(https?:\/\/[^\s]+)/g);

    return parts.map((part, i) => {
      const isUrl = part.startsWith('http://') || part.startsWith('https://');

      if (isUrl) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noreferrer"
            style={styles.link}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }

      return <span key={i}>{part}</span>;
    });
  };

  const renderPreview = (text) => {
    if (!text) return null;

    const lines = text.split('\n');

    return lines.map((line, index) => {

      if (isNetworkPath(line)) {
        const clean = line.trim();

        return (
          <div key={index} style={styles.networkBlock}>
            <div style={styles.networkText}>
              📎 {clean}
            </div>

            <div style={styles.buttonRow}>
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
        <div key={index} style={styles.line}>
          {renderTextWithLinks(line)}
        </div>
      );
    });
  };

  return (
    <div style={styles.container}>
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
  container: {
    width: '100%'
  },

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

    // 🔥 GARANTE CLIQUE SEM BLOQUEIO
    position: 'relative',
    zIndex: 1,
    pointerEvents: 'auto'
  },

  line: {
    marginBottom: 4,
    position: 'relative',
    zIndex: 2
  },

  link: {
    color: '#3b82f6',
    textDecoration: 'underline',
    cursor: 'pointer',
    position: 'relative',
    zIndex: 10,
    pointerEvents: 'auto'
  },

  networkBlock: {
    marginBottom: 10,
    position: 'relative',
    zIndex: 2
  },

  networkText: {
    color: '#fff'
  },

  buttonRow: {
    display: 'flex',
    gap: 8,
    marginTop: 4
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
