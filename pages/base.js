import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [topics, setTopics] = useState([]);
  const [commentsByTopic, setCommentsByTopic] = useState({});

  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  const [newTopic, setNewTopic] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const [commentInputs, setCommentInputs] = useState({});

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
      const key = c.topic_id || c.topico_id;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(c);
    });

    setTopics(topicsData || []);
    setCommentsByTopic(grouped);
  }

  async function createTopic() {
    if (!newTopic) return;

    await supabase.from('topicos').insert({
      titulo: newTopic,
      categoria: newCategory
    });

    setNewTopic('');
    setNewCategory('');
    loadTopics();
  }

  async function deleteTopic(id) {
    await supabase.from('topicos').delete().eq('id', id);
    loadTopics();
  }

  async function addComment(topicId, text) {
    if (!text || !text.trim()) return;

    const { error } = await supabase.from('comentarios').insert({
      topic_id: topicId,
      texto: text
    });

    if (!error) loadTopics();
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

      {/* HEADER */}
      <div style={styles.header}>
        <h1>Base de Conhecimento</h1>

        <div style={styles.actions}>
          <a href="/nova-categoria" style={styles.button}>+ Categoria</a>
          <a href="/novo-topico" style={styles.buttonPrimary}>+ Tópico</a>
          <a href="/excluir-categoria" style={styles.buttonDanger}>Excluir Categoria</a>
        </div>
      </div>

      {/* SEARCH */}
      <div style={styles.searchBox}>
        <input
          style={styles.search}
          placeholder="Buscar tópicos..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />

        <select
          style={styles.select}
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="">Todas categorias</option>
          {[...new Set(topics.map(t => t.categoria))].map((c, i) => (
            <option key={i} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* LIST */}
      {filtered.map(topic => (
        <div key={topic.id} style={styles.card}>

          <div style={styles.cardHeader}>
            <h3>{topic.titulo}</h3>

            <button
              style={styles.deleteBtn}
              onClick={() => deleteTopic(topic.id)}
            >
              Excluir
            </button>
          </div>

          <p style={styles.category}>{topic.categoria}</p>

          {/* COMMENTS */}
          <div style={styles.comments}>
            {(commentsByTopic[topic.id] || []).map(c => (
              <div key={c.id} style={styles.comment}>
                💬 {c.texto}
              </div>
            ))}
          </div>

          {/* ADD COMMENT */}
          <div style={styles.commentBox}>
            <input
              style={styles.commentInput}
              placeholder="Escrever comentário..."
              value={commentInputs[topic.id] || ''}
              onChange={e =>
                setCommentInputs(prev => ({
                  ...prev,
                  [topic.id]: e.target.value
                }))
              }
            />

            <button
              style={styles.sendBtn}
              onClick={() =>
                addComment(topic.id, commentInputs[topic.id])
              }
            >
              Enviar
            </button>
          </div>

        </div>
      ))}

    </Layout>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },

  actions: {
    display: 'flex',
    gap: 10
  },

  button: {
    padding: '8px 12px',
    background: '#222',
    color: '#fff',
    borderRadius: 6,
    textDecoration: 'none'
  },

  buttonPrimary: {
    padding: '8px 12px',
    background: '#f5c400',
    color: '#000',
    borderRadius: 6,
    textDecoration: 'none'
  },

  buttonDanger: {
    padding: '8px 12px',
    background: '#ff4444',
    color: '#fff',
    borderRadius: 6,
    textDecoration: 'none'
  },

  searchBox: {
    display: 'flex',
    gap: 10,
    marginBottom: 20
  },

  search: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: '1px solid #333',
    background: '#111',
    color: '#fff'
  },

  select: {
    padding: 10,
    borderRadius: 8,
    background: '#111',
    color: '#fff'
  },

  card: {
    background: '#111',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  category: {
    color: '#f5c400',
    fontSize: 12
  },

  comments: {
    marginTop: 10
  },

  comment: {
    fontSize: 12,
    color: '#aaa'
  },

  commentBox: {
    display: 'flex',
    gap: 10,
    marginTop: 10
  },

  commentInput: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    border: '1px solid #333',
    background: '#000',
    color: '#fff'
  },

  sendBtn: {
    padding: '8px 12px',
    background: '#f5c400',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer'
  }
};
