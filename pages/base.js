import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [user, setUser] = useState(null);

  const [topics, setTopics] = useState([]);
  const [commentsByTopic, setCommentsByTopic] = useState({});

  const [q, setQ] = useState('');
  const [commentInputs, setCommentInputs] = useState({});

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });

    load();
  }, []);

  async function load() {
    const { data: topicsData } = await supabase
      .from('topicos')
      .select('*')
      .order('id', { ascending: false });

    const { data: commentsData } = await supabase
      .from('comentarios')
      .select('*');

    const grouped = {};

    (commentsData || []).forEach(c => {
      if (!grouped[c.topic_id]) grouped[c.topic_id] = [];
      grouped[c.topic_id].push(c);
    });

    setTopics(topicsData || []);
    setCommentsByTopic(grouped);
  }

  async function addComment(topicId) {
    const text = commentInputs[topicId];

    if (!text || !text.trim()) return;

    const { error } = await supabase.from('comentarios').insert({
      topic_id: topicId,
      texto: text,
      user_id: user?.id
    });

    if (!error) {
      setCommentInputs(prev => ({ ...prev, [topicId]: '' }));
      load();
    }
  }

  async function deleteComment(id) {
    await supabase.from('comentarios').delete().eq('id', id);
    load();
  }

  function startEdit(comment) {
    setEditingId(comment.id);
    setEditingText(comment.texto);
  }

  async function saveEdit(id) {
    await supabase
      .from('comentarios')
      .update({ texto: editingText })
      .eq('id', id);

    setEditingId(null);
    setEditingText('');
    load();
  }

  const filtered = topics.filter(t =>
    (t.titulo || '').toLowerCase().includes(q.toLowerCase())
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

      {/* TOPICS */}
      {filtered.map(topic => (
        <div key={topic.id} style={styles.card}>

          <h3>{topic.titulo}</h3>
          <p style={{ color: '#f5c400' }}>{topic.categoria}</p>

          {/* COMMENTS */}
          {(commentsByTopic[topic.id] || []).map(c => (
            <div key={c.id} style={styles.comment}>

              {editingId === c.id ? (
                <>
                  <input
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    style={styles.input}
                  />
                  <button onClick={() => saveEdit(c.id)}>Salvar</button>
                </>
              ) : (
                <>
                  <span>💬 {c.texto}</span>

                  <button onClick={() => startEdit(c)}>✏️</button>
                  <button onClick={() => deleteComment(c.id)}>🗑</button>
                </>
              )}

            </div>
          ))}

          {/* ADD COMMENT */}
          <div style={styles.row}>
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
              enviar
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

  comment: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 5,
    color: '#aaa'
  },

  row: {
    display: 'flex',
    gap: 10,
    marginTop: 10
  },

  input: {
    flex: 1,
    padding: 8,
    background: '#000',
    color: '#fff',
    border: '1px solid #333'
  }
};
