import { useState } from 'react';

export default function KnowledgeSearch({ topics, commentsByTopic, onFilter }) {
  const [q, setQ] = useState('');

  function handleSearch(value) {
    setQ(value);

    const query = value.toLowerCase().trim();

    if (!query) {
      onFilter(topics);
      return;
    }

    const filtered = topics.filter(topic => {
      const title = (topic.titulo || '').toLowerCase();
      const desc = (topic.descricao || '').toLowerCase();

      const topicMatch =
        title.includes(query) || desc.includes(query);

      const comments = commentsByTopic[topic.id] || [];

      const commentMatch = comments.some(c =>
        (c.texto || '').toLowerCase().includes(query)
      );

      return topicMatch || commentMatch;
    });

    onFilter(filtered);
  }

  return (
    <div style={styles.box}>

      <input
        value={q}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Buscar na base de conhecimento..."
        style={styles.input}
      />

    </div>
  );
}

const styles = {
  box: {
    marginBottom: 20
  },

  input: {
    width: '100%',
    padding: 10,
    background: '#111',
    border: '1px solid #333',
    color: '#fff',
    borderRadius: 8
  }
};
