import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);

  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [newCategory, setNewCategory] = useState('');
  const [newTopic, setNewTopic] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const c = await supabase.from('categorias').select('*');
    const t = await supabase.from('topicos').select('*');
    const cm = await supabase.from('comentarios').select('*');

    setCategories(c.data || []);
    setTopics(t.data || []);
    setComments(cm.data || []);
  }

  /* ================= CATEGORIA ================= */

  async function createCategory() {
    await supabase.from('categorias').insert([{ nome: newCategory }]);
    setNewCategory('');
    load();
  }

  async function deleteCategory() {
    await supabase.from('categorias').delete().neq('id', null);
    load();
  }

  /* ================= TOPICO ================= */

  async function createTopic() {
    await supabase.from('topicos').insert([
      {
        titulo: newTopic,
        categoria_id: categories[0]?.id
      }
    ]);

    setNewTopic('');
    load();
  }

  /* ================= FILTER ================= */

  const filteredTopics = topics.filter(t =>
    t.titulo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <Layout>

        <div style={styles.container}>

          <h1 style={styles.title}>Base de Conhecimento</h1>

          {/* 🔎 SEARCH */}
          <input
            style={styles.search}
            placeholder="Buscar tópicos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* 🔘 ACTIONS */}
          <div style={styles.actions}>

            <input
              placeholder="Nova categoria"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={styles.input}
            />

            <button onClick={createCategory} style={styles.btn}>
              Nova Categoria
            </button>

            <input
              placeholder="Novo tópico"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              style={styles.input}
            />

            <button onClick={createTopic} style={styles.btn}>
              Novo Tópico
            </button>

            <button onClick={deleteCategory} style={styles.danger}>
              Excluir Categoria
            </button>

          </div>

          {/* 📄 TOPICS */}
          <div style={styles.list}>

            {filteredTopics.map(t => {

              const cat = categories.find(c => c.id === t.categoria_id);

              return (
                <div key={t.id} style={styles.card}>

                  <h3 style={{ color: '#f5c400' }}>{t.titulo}</h3>

                  <p style={{ color: '#aaa' }}>
                    Categoria: {cat?.nome || 'Sem categoria'}
                  </p>

                  <button
                    style={styles.commentBtn}
                    onClick={() =>
                      setSelectedTopic(selectedTopic === t.id ? null : t.id)
                    }
                  >
                    Comentários
                  </button>

                  {/* 💬 COMMENTS */}
                  {selectedTopic === t.id && (
                    <div style={styles.comments}>

                      {comments
                        .filter(c => c.topico_id === t.id)
                        .map(c => (
                          <div key={c.id} style={styles.comment}>
                            {c.texto}
                          </div>
                        ))}

                    </div>
                  )}

                </div>
              );
            })}

          </div>

        </div>

      </Layout>
    </ProtectedRoute>
  );
}
