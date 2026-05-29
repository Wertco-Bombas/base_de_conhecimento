export default function RichText({ value, onChange }) {

  const convertNetworkPathsToLinks = (text) => {

    if (!text) return '';

    const regex = /\\\\.*?(?=\n|$)/g;

    return text.replace(regex, (match) => {

      const normalized = match.replace(/\\/g, '/');

      const href = `file:///${normalized}`;

      return `
        <a
          href="${href}"
          target="_blank"
          rel="noopener noreferrer"
          style="
            color:#3b82f6;
            text-decoration:underline;
            cursor:pointer;
            display:block;
            margin-top:4px;
          "
        >
          📎 ${match}
        </a>
      `;
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

      <div
        style={styles.preview}
        dangerouslySetInnerHTML={{
          __html: convertNetworkPathsToLinks(value)
        }}
      />
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
