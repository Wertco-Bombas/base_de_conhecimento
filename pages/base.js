import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [user, setUser] = useState(null);

  const [topics, setTopics] = useState([]);
  const [commentsByTopic, setCommentsByTopic] = useState({});
  const [categories, setCategories] = useState([]);

  // MODAIS
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteTopicModal, setShowDeleteTopicModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);

  // TOPIC FORM
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

    const cats = [...new Set((topicsData || []).map(t => t.categoria))];
    setCategories(cats);
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

  // ---------------- CATEGORY (placeholder) ----------------
  async function createCategory() {
    alert('Aqui você pode criar tabela categorias depois');
    setShowCategoryModal(false);
  }

  async function deleteCategory() {
    alert('Precisa implementar tabela de categorias');
    setShowDeleteCategoryModal(false);
  }

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

      {/* LISTA DE TÓPICOS */}
      {topics.map(topic => (
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

          {/* COMMENTS PREVIEW */}
          {(commentsByTopic[topic.id] || []).slice(0, 3).map(c => (
            <div key={c.id} style={styles.comment}>
              💬 {c.texto}
            </div>
          ))}

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

            <textarea
              placeholder="Descrição"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
            />

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">Selecione categoria</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>

            <button onClick={createTopic}>Salvar</button>
            <button onClick={() => setShowTopicModal(false)}>Fechar</button>
          </div>
        </div>
      )}

      {/* ---------------- MODAL CATEGORY ---------------- */}
      {showCategoryModal && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3>Nova Categoria</h3>
            <p>Você pode evoluir isso depois com tabela própria.</p>

            <button onClick={createCategory}>OK</button>
            <button onClick={() => setShowCategoryModal(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* DELETE CATEGORY */}
      {showDeleteCategoryModal && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h3>Excluir Categoria</h3>

            <button onClick={deleteCategory}>Confirmar</button>
            <button onClick={() => setShowDeleteCategoryModal(false)}>
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
    color: '#aaa'
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
