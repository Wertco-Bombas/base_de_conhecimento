import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [user, setUser] = useState(null);

  const [topics, setTopics] = useState([]);
  const [commentsByTopic, setCommentsByTopic] = useState({});
  const [categories, setCategories] = useState([]);

  const [q, setQ] = useState('');

  const [commentInputs, setCommentInputs] = useState({});

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // MODALS
  const [openTopicModal, setOpenTopicModal] = useState(false);
  const [openCategoryModal, setOpenCategoryModal] = useState(false);

  // FORMS
  const [newTopic, setNewTopic] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');

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

    // categorias dinâmicas
    const cats = [...new Set((topicsData || []).map(t => t.categoria))];
    setCategories(cats);
  }

  // ---------------- TOPIC ----------------
  async function createTopic() {
    if (!newTopic || !selectedCategory) return;

    await supabase.from('topicos').insert({
      titulo: newTopic,
      categoria: selectedCategory
    });

    setNewTopic('');
    setSelectedCategory('');
    setOpenTopicModal(false);

    load();
  }

  async function deleteTopic(id) {
    await supabase.from('topicos').delete().eq('id', id);
    load();
  }

  async function deleteCategory(cat) {
    await supabase.from('topicos').delete().eq('categoria', cat);
    load();
  }

  // ---------------- COMMENTS ----------------
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

      {/* HEADER */}
      <div style={styles.header}>
        <h1>Base de Conhecimento</h1>

        <div style={styles.actions}>
          <button onClick={() => setOpenCategoryModal(true)}>
            + Categoria
          </button>

          <button onClick={() => setOpenTopicModal(true)}>
            + Tópico
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

      {/* CATEGORIES */}
      <div style={styles.categories}>
        {categories.map((c, i) => (
          <div key={i} style={styles.category}>
            {c}
            <button onClick={() => deleteCategory(c)}>✕</button>
          </div>
        ))}
      </div>

      {/* TOPICS */}
      {filtered.map(topic => (
        <div key={topic.id} style={styles.card}>

          <div style={styles.topRow}>
            <h3>{topic.titulo}</h3>
            <button onClick={() => deleteTopic(topic.id)}>
              Excluir
            </button>
          </div>

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

                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => startEdit(c)}>✏️</button>
                    <button onClick={() => deleteComment(c.id)}>🗑</button>
                  </div>
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

      {/* MODAL TOPIC */}
      {openTopicModal && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3>Novo Tópico</h3>

            <input
              placeholder="Título"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
            />

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">Categoria</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>

            <button onClick={createTopic}>Criar</button>
            <button onClick={() => setOpenTopicModal(false)}>Fechar</button>
          </div>
        </div>
      )}

      {/* MODAL CATEGORY */}
      {openCategoryModal && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3>Nova Categoria</h3>

            <input
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="Nome categoria"
            />

            <button onClick={() => {
              setCategories(prev => [...new Set([...prev, newCategory])]);
              setNewCategory('');
              setOpenCategoryModal(false);
            }}>
              Criar
            </button>

            <button onClick={() => setOpenCategoryModal(false)}>
              Fechar
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

  categories: {
    display: 'flex',
    gap: 10,
    marginBottom: 15,
    flexWrap: 'wrap'
  },

  category: {
    background: '#222',
    padding: '5px 10px',
    borderRadius: 20,
    display: 'flex',
    gap: 5,
    alignItems: 'center',
    color: '#fff'
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
    width: 320,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  }
};
