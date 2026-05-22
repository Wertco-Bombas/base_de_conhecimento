import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [user, setUser] = useState(null);

  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [newCategory, setNewCategory] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const u = await supabase.auth.getUser();
    setUser(u.data?.user);

    loadAll();
  }

  async function loadAll() {
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
    loadAll();
  }

  async function deleteCategory(id) {
    await supabase.from('categorias').delete().eq('id', id);
    loadAll();
  }

  /* ================= TOPICO ================= */

  async function createTopic() {
    await supabase.from('topicos').insert([
      {
        titulo: newTopic,
        categoria_id: selectedCategory
      }
    ]);

    setNewTopic('');
    loadAll();
  }

  async function deleteTopic(id) {
    await supabase.from('topicos').delete().eq('id', id);
    loadAll();
  }

  /* ================= COMMENT ================= */

  async function createComment(topicId) {
    const { data } = await supabase.auth.getUser();

    await supabase.from('comentarios').insert([
      {
        topico_id: topicId,
        texto: newComment,
        user_id: data.user.id
      }
    ]);

    setNewComment('');
    loadAll();
  }

  const filteredTopics = selectedCategory
    ? topics.filter(t => t.categoria_id === selectedCategory)
    : topics;

  return (
    <Layout>
      <ProtectedRoute>

        <div style={styles.container}>

          <h1 style={styles.title}>Base de Conhecimento</h1>

          {/* CATEGORY CONTROLS */}
          <div style={styles.box}>

            <h3>Categorias</h3>

            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={styles.input}
              placeholder="Nova categoria"
            />

            <button onClick={createCategory} style={styles.btn}>
              Nova Categoria
            </button>

            <div style={styles.row}>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  style={styles.catBtn}
                >
                  {c.nome}

                  <span onClick={() => deleteCategory(c.id)}> ❌</span>
                </button>
              ))}
            </div>

          </div>

          {/* TOPICS */}
          <div style={styles.box}>

            <h3>Tópicos</h3>

            <input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              style={styles.input}
              placeholder="Novo tópico"
            />

            <button onClick={createTopic} style={styles.btn}>
              Novo Tópico
            </button>

            {filteredTopics.map(t => (
              <div key={t.id} style={styles.card}>

                <h4>{t.titulo}</h4>

                <button onClick={() => deleteTopic(t.id)} style={styles.delete}>
                  Excluir
                </button>

                <button
                  onClick={() =>
                    setSelectedTopic(selectedTopic === t.id ? null : t.id)
                  }
                  style={styles.secondary}
                >
                  Comentários
                </button>

                {selectedTopic === t.id && (
                  <div>

                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      style={styles.textarea}
                    />

                    <button onClick={() => createComment(t.id)} style={styles.btn}>
                      Enviar comentário
                    </button>

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
            ))}

          </div>

        </div>

      </ProtectedRoute>
    </Layout>
  );
}

const styles = {
  container: { padding: 20, color: '#fff' },

  title: { color: '#f5c400' },

  box: {
    background: '#111',
    padding: 15,
    marginTop: 20,
    borderRadius: 10
  },

  input: {
    width: '100%',
    padding: 10,
    marginTop: 10,
    background: '#000',
    color: '#fff',
    border: '1px solid #333'
  },

  btn: {
    marginTop: 10,
    background: '#f5c400',
    padding: 10,
    border: 0,
    cursor: 'pointer'
  },

  catBtn: {
    margin: 5,
    padding: 8,
    background: '#222',
    color: '#fff',
    border: '1px solid #333'
  },

  row: {
    display: 'flex',
    flexWrap: 'wrap',
    marginTop: 10
  },

  card: {
    marginTop: 10,
    padding: 10,
    background: '#000',
    border: '1px solid #333'
  },

  delete: {
    background: 'red',
    color: '#fff',
    border: 0,
    marginLeft: 10
  },

  secondary: {
    background: '#333',
    color: '#f5c400',
    border: 0,
    marginLeft: 10
  },

  textarea: {
    width: '100%',
    height: 80,
    marginTop: 10
  },

  comment: {
    marginTop: 5,
    padding: 5,
    background: '#111'
  }
};
