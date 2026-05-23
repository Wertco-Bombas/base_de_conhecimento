import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [user, setUser] = useState(null);

  const [topics, setTopics] = useState([]);
  const [commentsByTopic, setCommentsByTopic] = useState({});

  const [q, setQ] = useState('');
  const [commentInputs, setCommentInputs] = useState({});

  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteTopicModal, setShowDeleteTopicModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);

  const [newTopic, setNewTopic] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

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

  // ---------------- TOPIC ----------------
  async function createTopic() {
    if (!newTopic || !selectedCategory) return;

    await supabase.from('topicos').insert({
      titulo: newTopic,
      descricao: newDescription,
      categoria: selectedCategory,
      user_email: user?.email,
      created_at: new Date()
    });

    setNewTopic('');
    setNewDescription('');
    setSelectedCategory('');
    setShowTopicModal(false);

    load();
  }

  async function deleteTopic(id) {
    await supabase.from('topicos').delete().eq('id', id);
    load();
  }

  // ---------------- COMMENTS ----------------
  async function addComment(topicId) {
    const text = commentInputs[topicId];

    if (!text || !text.trim()) return;

    const { error } = await supabase.from('comentarios').insert({
      topic_id: topicId,
      texto: text,
      user_email: user?.email,
      created_at: new Date()
    });

    if (!error) {
      setCommentInputs(prev => ({
        ...prev,
        [topicId]: ''
      }));
      load();
    } else {
      console.log('ERROR COMMENT:', error);
    }
  }

  const filtered = topics.filter(t =>
    (t.titulo || '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Layout>

      {/* HEADER */}
      <div style={styles.header}>
        <h1>Base de Conhecimento</h1>

        <div style={styles.actions}>
          <button onClick={() => setShowCategoryModal(true)}>
            + Categoria
          </button>

          <button onClick={() => setShowTopicModal(true)}>
            + Tópico
          </button>

          <button onClick={() => setShowDeleteCategoryModal(true)}>
            Excluir Categoria
          </button>
        </div>
      </div>

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

          <div style={styles.topRow}>
            <h3>{topic.titulo}</h3>

            <button onClick={() => deleteTopic(topic.id)}>
              Excluir Tópico
            </button>
          </div>

          <p>{topic.descricao}</p>

          <p style={styles.category}>
            {topic.categoria}
          </p>

          {/* COMMENTS LIST */}
          <div style={{ marginTop: 10 }}>
            {(commentsByTopic[topic.id] || []).map(c => (
              <div key={c.id} style={styles.comment}>
                💬 {c.texto}
              </div>
            ))}
          </div>

          {/* COMMENT INPUT */}
          <div style={styles.commentBox}>
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

      {/* MODAL TOPIC */}
      {showTopicModal && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3>Novo Tópico</h3>

            <input
              placeholder="Título"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
            />

            <textarea
              placeholder="Descrição"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
            />

            <input
              placeholder="Categoria"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            />

            <button onClick={createTopic}>Salvar</button>
            <button onClick={() => setShowTopicModal(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {showCategoryModal && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3>Nova Categoria</h3>
            <p>implementar depois</p>
            <button onClick={() => setShowCategoryModal(false)}>OK</button>
          </div>
        </div>
      )}

      {/* DELETE CATEGORY */}
      {showDeleteCategoryModal && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3>Excluir Categoria</h3>
            <button onClick={() => setShowDeleteCategoryModal(false)}>
              fechar
            </button>
          </div>
        </div>
      )}

    </Layout>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 20
  },

  actions: {
    display: 'flex',
    gap: 10
  },

  search: {
    width: '100%',
    padding: 10,
    marginBottom: 20,
    background: '#111',
    color: '#fff',
    border: '1px solid #333'
  },

  card: {
    background: '#111',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10
  },

  topRow: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  category: {
    color: '#f5c400'
  },

  comment: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4
  },

  commentBox: {
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
  },

  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  modalBox: {
    background: '#111',
    padding: 20,
    borderRadius: 10,
    width: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  }
};
