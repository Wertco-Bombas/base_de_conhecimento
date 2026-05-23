import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [topics, setTopics] = useState([]);
  const [commentsByTopic, setCommentsByTopic] = useState({});

  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  const [commentInputs, setCommentInputs] = useState({});

  // MODALS
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);

  const [newTopic, setNewTopic] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    loadTopics();
  }, []);

  async function loadTopics() {
    const { data: topicsData, error: topicsError } = await supabase
      .from('topicos')
      .select('*')
      .order('id', { ascending: false });

    const { data: commentsData, error: commentsError } = await supabase
      .from('comentarios')
      .select('*');

    console.log('TOPICS:', topicsData, topicsError);
    console.log('COMMENTS:', commentsData, commentsError);

    const grouped = {};

    (commentsData || []).forEach(c => {
      const key = c.topic_id;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(c);
    });

    setTopics(topicsData || []);
    setCommentsByTopic(grouped);
  }

  // ---------------- TOPIC ----------------
  async function createTopic() {
    const { error } = await supabase.from('topicos').insert({
      titulo: newTopic,
      categoria: newCategory
    });

    console.log('CREATE TOPIC ERROR:', error);

    if (!error) {
      setNewTopic('');
      setNewCategory('');
      setShowTopicModal(false);
      loadTopics();
    }
  }

  async function deleteTopic(id) {
    await supabase.from('topicos').delete().eq('id', id);
    loadTopics();
  }

  // ---------------- COMMENT (FIX PRINCIPAL) ----------------
  async function addComment(topicId) {
    const text = commentInputs[topicId];

    console.log('COMMENT CLICK:', { topicId, text });

    if (!text || !text.trim()) {
      alert('Comentário vazio');
      return;
    }

    const { error } = await supabase.from('comentarios').insert({
      topic_id: topicId,
      texto: text
    });

    console.log('COMMENT ERROR:', error);

    if (error) {
      alert(error.message);
      return;
    }

    setCommentInputs(prev => ({ ...prev, [topicId]: '' }));
    loadTopics();
  }

  const filtered = topics.filter(t =>
    (t.titulo || '').toLowerCase().includes(q.toLowerCase())
  ).filter(t =>
    category ? t.categoria === category : true
  );

  return (
    <Layout>

      {/* HEADER */}
      <div style={styles.header}>
        <h1>Base de Conhecimento</h1>

        <div style={styles.actions}>
          <button onClick={() => setShowCategoryModal(true)}>+ Categoria</button>
          <button onClick={() => setShowTopicModal(true)}>+ Tópico</button>
          <button onClick={() => setShowDeleteCategoryModal(true)}>Excluir Categoria</button>
        </div>
      </div>

      {/* SEARCH */}
      <input
        style={styles.search}
        placeholder="Buscar..."
        value={q}
        onChange={e => setQ(e.target.value)}
      />

      {/* LIST */}
      {filtered.map(topic => (
        <div key={topic.id} style={styles.card}>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>{topic.titulo}</h3>

            <button onClick={() => deleteTopic(topic.id)}>
              Excluir
            </button>
          </div>

          <p style={{ color: '#f5c400' }}>{topic.categoria}</p>

          {/* COMMENTS */}
          {(commentsByTopic[topic.id] || []).map(c => (
            <div key={c.id} style={styles.comment}>
              💬 {c.texto}
            </div>
          ))}

          {/* INPUT COMMENT */}
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
              Enviar
            </button>
          </div>

        </div>
      ))}

      {/* ---------------- MODAL TOPIC ---------------- */}
      {showTopicModal && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3>Novo Tópico</h3>

            <input
              placeholder="Título"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
            />

            <input
              placeholder="Categoria"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
            />

            <button onClick={createTopic}>Salvar</button>
            <button onClick={() => setShowTopicModal(false)}>Fechar</button>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL (placeholder simples) */}
      {showCategoryModal && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3>Nova Categoria</h3>
            <p>Você pode criar tabela depois. Aqui é UI pronta.</p>
            <button onClick={() => setShowCategoryModal(false)}>Fechar</button>
          </div>
        </div>
      )}

      {/* DELETE CATEGORY MODAL */}
      {showDeleteCategoryModal && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3>Excluir Categoria</h3>
            <p>Implementação futura (precisa tabela categorias)</p>
            <button onClick={() => setShowDeleteCategoryModal(false)}>Fechar</button>
          </div>
        </div>
      )}

    </Layout>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 20 },
  actions: { display: 'flex', gap: 10 },

  search: {
    width: '100%',
    padding: 10,
    marginBottom: 20,
    background: '#111',
    color: '#fff'
  },

  card: {
    background: '#111',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10
  },

  comment: {
    fontSize: 12,
    color: '#aaa'
  },

  input: {
    flex: 1,
    padding: 8,
    background: '#000',
    color: '#fff'
  },

  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  modalBox: {
    background: '#111',
    padding: 20,
    borderRadius: 10,
    width: 300,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  }
};
