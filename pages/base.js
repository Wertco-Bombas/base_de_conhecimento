import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [topics, setTopics] = useState([]);

  const [categories, setCategories] = useState([]);

  const [q, setQ] = useState('');

  // MODALS
  const [openTopic, setOpenTopic] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);

  // FORM
  const [newTopic, setNewTopic] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: topicsData } = await supabase
      .from('topicos')
      .select('*')
      .order('id', { ascending: false });

    setTopics(topicsData || []);

    // categorias dinâmicas (simples)
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
    setOpenTopic(false);
    load();
  }

  async function deleteTopic(id) {
    await supabase.from('topicos').delete().eq('id', id);
    load();
  }

  // ---------------- CATEGORY ----------------
  async function createCategory() {
    if (!newCategory) return;

    // categoria não é tabela, então só UI (ou pode evoluir depois)
    setCategories(prev => [...new Set([...prev, newCategory])]);

    setNewCategory('');
    setOpenCategory(false);
  }

  async function deleteCategory(cat) {
    const confirmDelete = confirm(
      `Excluir categoria "${cat}" e todos os tópicos dela?`
    );

    if (!confirmDelete) return;

    await supabase
      .from('topicos')
      .delete()
      .eq('categoria', cat);

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
          <button onClick={() => setOpenCategory(true)}>
            + Categoria
          </button>

          <button onClick={() => setOpenTopic(true)}>
            + Tópico
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <input
        style={styles.search}
        placeholder="Buscar tópicos..."
        value={q}
        onChange={e => setQ(e.target.value)}
      />

      {/* CATEGORIES */}
      <div style={styles.categoryBar}>
        {categories.map((cat, i) => (
          <div key={i} style={styles.categoryChip}>
            {cat}

            <button onClick={() => deleteCategory(cat)}>
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* TOPICS */}
      {filtered.map(topic => (
        <div key={topic.id} style={styles.card}>

          <div style={styles.cardHeader}>
            <h3>{topic.titulo}</h3>

            <button onClick={() => deleteTopic(topic.id)}>
              Excluir
            </button>
          </div>

          <span style={styles.tag}>
            {topic.categoria}
          </span>

        </div>
      ))}

      {/* ---------------- MODAL TOPIC ---------------- */}
      {openTopic && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>

            <h3>Novo Tópico</h3>

            <input
              placeholder="Título"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
            />

            {/* CATEGORIA SELECT */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">Selecione categoria</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>

            <button onClick={createTopic}>
              Criar
            </button>

            <button onClick={() => setOpenTopic(false)}>
              Fechar
            </button>

          </div>
        </div>
      )}

      {/* ---------------- MODAL CATEGORY ---------------- */}
      {openCategory && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>

            <h3>Nova Categoria</h3>

            <input
              placeholder="Nome da categoria"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
            />

            <button onClick={createCategory}>
              Criar
            </button>

            <button onClick={() => setOpenCategory(false)}>
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
    marginBottom: 20,
    alignItems: 'center'
  },

  actions: {
    display: 'flex',
    gap: 10
  },

  search: {
    width: '100%',
    padding: 10,
    marginBottom: 15,
    background: '#111',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: 8
  },

  categoryBar: {
    display: 'flex',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap'
  },

  categoryChip: {
    background: '#222',
    padding: '5px 10px',
    borderRadius: 20,
    color: '#fff',
    display: 'flex',
    gap: 8,
    alignItems: 'center'
  },

  card: {
    background: '#111',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  tag: {
    color: '#f5c400',
    fontSize: 12
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
    width: 320,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  }
};
