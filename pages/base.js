import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [user, setUser] = useState(null);

  const [topics, setTopics] = useState([]);
  const [commentsByTopic, setCommentsByTopic] = useState({});

  const [q, setQ] = useState('');

  const [commentInputs, setCommentInputs] = useState({});

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });

    loadTopics();

    // 🔥 REALTIME
    const channel = supabase
      .channel('comments-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comentarios' },
        () => loadTopics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  // ---------------- TOPICS ----------------
  async function deleteTopic(id) {
    await supabase.from('topicos').delete().eq('id', id);
    loadTopics();
  }

  // ---------------- COMMENTS ----------------
  async function addComment(topicId) {
    const text = commentInputs[topicId];

    if (!text || !text.trim()) return;

    await supabase.from('comentarios').insert({
      topic_id: topicId,
      texto: text,
      user_id: user?.id
    });

    setCommentInputs(prev => ({ ...prev, [topicId]: '' }));
  }

  async function deleteComment(id) {
    await supabase.from('comentarios').delete().eq('id', id);
  }

  function startEdit(comment) {
    setEditingCommentId(comment.id);
    setEditingText(comment.texto);
  }

  async function saveEdit(id) {
    await supabase
      .from('comentarios')
      .update({ texto: editingText })
      .eq('id', id);

    setEditingCommentId(null);
    setEditingText('');
  }

  // ---------------- THREAD RENDER ----------------
  const renderComments = (topicId, parentId = null) => {
    return (commentsByTopic[topicId] || [])
      .filter(c => (c.parent_id || null) === parentId)
      .map(c => (
        <div key={c.id} style={styles.commentBox}>

          {editingCommentId === c.id ? (
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
              <div style={{ color: '#aaa' }}>
                💬 {c.texto}
              </div>

              <small style={{ color: '#666' }}>
                {c.user_id ? `user: ${c.user_id.slice(0, 6)}` : 'anon'}
              </small>

              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => startEdit(c)}>✏️</button>
                <button onClick={() => deleteComment(c.id)}>🗑</button>

                <button
                  onClick={() => {
                    const text = prompt('Responder comentário:');
                    if (!text) return;

                    supabase.from('comentarios').insert({
                      topic_id: topicId,
                      parent_id: c.id,
                      texto: text,
                      user_id: user?.id
                    }).then(() => loadTopics());
                  }}
                >
                  ↳ responder
                </button>
              </div>

              {/* RECURSIVO */}
              <div style={{ marginLeft: 20 }}>
                {renderComments(topicId, c.id)}
              </div>
            </>
          )}

        </div>
      ));
  };

  const filtered = topics.filter(t =>
    (t.titulo || '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Layout>

      <h1>Base de Conhecimento</h1>

      {/* SEARCH */}
      <input
        style={styles.search}
        placeholder="Buscar..."
        value={q}
        onChange={e => setQ(e.target.value)}
      />

      {/* TOPICS */}
      {filtered.map(topic => (
        <div key={topic.id} style={styles.card}>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>{topic.titulo}</h3>

            <button onClick={() => deleteTopic(topic.id)}>
              excluir
            </button>
          </div>

          <p style={{ color: '#f5c400' }}>{topic.categoria}</p>

          {/* COMMENTS TREE */}
          <div>
            {renderComments(topic.id)}
          </div>

          {/* ADD COMMENT */}
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <input
              style={styles.input}
              placeholder="Comentar..."
              value={commentInputs[topic.id] || ''}
              onChange={e =>
                setCommentInputs(prev => ({
                  ...prev,
                  [topic.id]: e.target.value
                }))
              }
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

  commentBox: {
    marginTop: 8,
    padding: 8,
    background: '#0a0a0a',
    borderRadius: 6
  },

  input: {
    flex: 1,
    padding: 8,
    background: '#000',
    color: '#fff',
    border: '1px solid #333'
  }
};
