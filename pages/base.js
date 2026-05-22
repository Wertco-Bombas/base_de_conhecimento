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

  const fetchCategories = async () => {
    const { data } = await supabase.from('categorias').select('*');
    setCategories(data || []);
  };

  const fetchTopics = async () => {
    const { data } = await supabase.from('topicos').select('*');
    setTopics(data || []);
  };

  const filteredTopics = topics.filter((t) => {
    const matchCategory = selectedCategory ? t.categoria_id === selectedCategory : true;
    const matchSearch = t.titulo?.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <ProtectedRoute>
      <Layout>

        <h1 style={{ color: '#f5c400' }}>Base de Conhecimento</h1>

        {/* BUSCA */}
        <input
          placeholder="Buscar tópicos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.input}
        />

        {/* CATEGORIAS */}
        <div style={styles.categories}>
          <button onClick={() => setSelectedCategory(null)} style={styles.catBtn}>
            Todas
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              style={styles.catBtn}
            >
              {c.nome}
            </button>
          ))}
        </div>

        {/* BOTÕES */}
        <div style={styles.actions}>
          <button style={styles.btn}>Nova Categoria</button>
          <button style={styles.btn}>Novo Tópico</button>
          <button style={styles.danger}>Excluir Categoria</button>
          <button style={styles.danger}>Excluir Tópico</button>
        </div>

        {/* LISTA DE TÓPICOS */}
        <div style={styles.list}>
          {filteredTopics.map((t) => (
            <div key={t.id} style={styles.card}>
              <h3 style={{ color: '#f5c400' }}>{t.titulo}</h3>
              <p style={{ color: '#aaa' }}>Categoria: {t.categoria_id}</p>

              <button style={styles.commentBtn}>
                Comentários
              </button>
            </div>
          ))}
        </div>

      </Layout>
    </ProtectedRoute>
  );
}
