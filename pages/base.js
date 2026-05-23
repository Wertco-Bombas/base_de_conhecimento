import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [topics, setTopics] = useState([]);
  const [commentsByTopic, setCommentsByTopic] = useState({});

  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  const [commentInputs, setCommentInputs] = useState({});

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    loadTopics();
  }, []);

  async function loadTopics() {
    const { data: topicsData } = await supabase
      .from('topicos')
      .select('*')
      .order('id', { ascending: false });

    const { data: commentsData } = await supabase
      .from('comentarios')
      .select('*');

    const grouped = {};

    (commentsData || []).forEach(c => {
      const key = c.topic_id;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(c);
    });

    setTopics(topicsData || []);
    setCommentsByTopic(grouped);
  }

  async function addComment(topicId) {
    const text = commentInputs[topicId];

    if (!text || !text.trim()) return;

    await supabase.from('comentarios').insert({
      topic_id: topicId,
      texto: text
    });

    setCommentInputs(prev => ({ ...prev, [topicId]: '' }));
    loadTopics();
  }

  // 🗑 DELETE COMMENT
  async function deleteComment(id) {
    await supabase
      .from('comentarios')
      .delete()
      .eq('id', id);

    loadTopics();
  }

  // ✏️ START EDIT
  function startEdit(comment) {
    setEditingCommentId(comment.id);
    setEditingText(comment.texto);
  }

  // 💾 SAVE EDIT
  async function saveEdit(id) {
    await supabase
      .from('comentarios')
      .update({ texto: editingText })
      .eq('id', id);

    setEditingCommentId(null);
    setEditingText('');
    loadTopics();
  }

  const filtered = topics
    .filter(t =>
      (t.titulo || '').toLowerCase().includes(q.toLowerCase())
    )
    .filter(t =>
      category ? t.categoria === category : true
    );

  return (
    <Layout>

      <h1>Base de Conhecimento</h1>

      {/* SEARCH */}
      <input
        placeholder="Buscar..."
        value={q}
        onChange={e => setQ(e.target.value)}
        style={styles.search}
      />

      {/* LIST */}
      {filtered.map(topic => (
        <div key={topic.id} style={styles.card}>

          <h3>{topic.titulo}</h3>
          <p style={{ color: '#f5c400' }}>{topic.categoria}</p>

          {/* COMMENTS */}
          {(commentsByTopic[topic.id] || []).map(c => (
            <div key={c.id} style={styles.commentBox}>

              {editingCommentId === c.id ? (
                <>
                  <input
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    style={styles.input}
                  />

                  <button onClick={() => saveEdit(c.id)}>
                    Salvar
                  </button>
                </>
              ) : (
                <>
                  <span style={{ color: '#aaa' }}>💬 {c.texto}</span>

                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => startEdit(c)}>✏️</button>
                    <button onClick={() => deleteComment(c.id)}>🗑</button>
                  </div>
                </>
              )}

            </div>
          ))}

          {/* ADD COMMENT */}
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <input
              placeholder="Comentar..."
              value={commentInputs[topic.id] || ''}
              onChange={e =>
                setCommentInputs(prev => ({
                  ...prev,
                  [topic.id]: e.target.value
                }))
              }
              style={styles.input}
            />

            <button onClick={() => addComment(topic.id)}>
              Enviar
            </button>
          </div>

        </div>
      ))}

    </Layout>
  );
}

const styles = {
  card: {
    background: '#111',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10
  },

  search: {
    width: '100%',
    padding: 10,
    marginBottom: 20,
    background: '#111',
    color: '#fff'
  },

  commentBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    gap: 10
  },

  input: {
    flex: 1,
    padding: 6,
    background: '#000',
    color: '#fff',
    border: '1px solid #333'
  }
};
