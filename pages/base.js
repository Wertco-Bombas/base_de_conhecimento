import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';

export default function BaseConhecimento() {
  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchTopics();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase.from('categorias').select('*');
    setCategories(data || []);
  }

  async function fetchTopics() {
    const { data } = await supabase.from('topicos').select('*');
    setTopics(data || []);
  }

  const filteredTopics = topics.filter((t) => {
    const matchCategory = selectedCategory
      ? t.categoria_id === selectedCategory
      : true;

    const matchSearch = t.titulo
      ?.toLowerCase()
      .includes(search.toLowerCase());

    return matchCategory && matchSearch;
  });

  return (
    <ProtectedRoute>
      <Layout>
        <div style={styles.container}>

          <h1 style={styles.title}>Base de Conhecimento</h1>

          {/* BUSCA */}
          <input
            style={styles.search}
            placeholder="Buscar tópicos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* CATEGORIAS */}
          <div style={styles.categories}>
            <button
              style={styles.catBtn}
              onClick={() => setSelectedCategory(null)}
            >
              Todas
            </button>

            {categories.map((c) => (
              <button
                key={c.id}
                style={styles.catBtn}
                onClick={() => setSelectedCategory(c.id)}
              >
                {c.nome}
              </button>
            ))}
          </div>

          {/* AÇÕES */}
          <div style={styles.actions}>
            <button style={styles.btn}>Nova Categoria</button>
            <button style={styles.btn}>Novo Tópico</button>
            <button style={styles.danger}>Excluir Categoria</button>
            <button style={styles.danger}>Excluir Tópico</button>
          </div>

          {/* TÓPICOS */}
          <div style={styles.grid}>
            {filteredTopics.map((t) => (
              <div key={t.id} style={styles.card}>
                <h3 style={styles.topicTitle}>{t.titulo}</h3>
                <p style={styles.meta}>
                  Categoria: {t.categoria_id}
                </p>

                <button style={styles.commentBtn}>
                  Comentários
                </button>
              </div>
            ))}
          </div>

        </div>
      </Layout>
    </ProtectedRoute>
  );
}

const styles = {
  container: {
    padding: '20px',
    color: '#fff'
  },

  title: {
    color: '#f5c400',
    marginBottom: '15px'
  },

  search: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #333',
    background: '#1a1a1a',
    color: '#fff'
  },

  categories: {
    marginTop: '15px',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },

  catBtn: {
    background: '#1a1a1a',
    color: '#f5c400',
    border: '1px solid #333',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer'
  },

  actions: {
    marginTop: '20px',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },

  btn: {
    background: '#f5c400',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  danger: {
    background: '#333',
    color: '#fff',
    border: '1px solid #555',
    padding: '10px 15px',
    borderRadius: '8px',
    cursor: 'pointer'
  },

  grid: {
    marginTop: '20px',
    display: 'grid',
    gap: '10px'
  },

  card: {
    background: '#1a1a1a',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid #222'
  },

  topicTitle: {
    color: '#f5c400'
  },

  meta: {
    color: '#aaa',
    fontSize: '14px'
  },

  commentBtn: {
    marginTop: '10px',
    background: '#f5c400',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};
