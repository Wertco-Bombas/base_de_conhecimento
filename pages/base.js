import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';

export default function BaseConhecimento() {
  const [user, setUser] = useState(null);

  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);

  const [selectedTopic, setSelectedTopic] = useState(null);

  const [search, setSearch] = useState('');

  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('');

  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);

    fetchCategories();
    fetchTopics();
    fetchComments();
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categorias').select('*');
    setCategories(data || []);
  }

  async function fetchTopics() {
    const { data } = await supabase.from('topicos').select('*');
    setTopics(data || []);
  }

  async function fetchComments() {
    const { data } = await supabase.from('comentarios').select('*');
    setComments(data || []);
  }

  /* =========================
     CREATE TOPIC (SIMPLIFICADO)
  ========================== */
  async function createTopic() {
    if (!newTopicTitle || !newTopicCategory) return;
    if (!user) return;

    await supabase.from('topicos').insert([
      {
        titulo: newTopicTitle,
        categoria_id: newTopicCategory,
        user_id: user.id
      }
    ]);

    setNewTopicTitle('');
    setNewTopicCategory('');
    fetchTopics();
  }

  /* =========================
     CREATE COMMENT (SIMPLIFICADO)
  ========================== */
  async function createComment() {
    if (!selectedTopic || !newComment) return;

    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;

    if (!userId) return;

    await supabase.from('comentarios').insert([
      {
        topico_id: selectedTopic,
        texto: newComment,
        user_id: userId
      }
    ]);

    setNewComment('');
    fetchComments();
  }

  async function deleteComment(id) {
    await supabase.from('comentarios').delete().eq('id', id);
    fetchComments();
  }

  const filteredTopics = topics.filter((t) =>
    t.titulo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <Layout>

        <div style={{ padding: 20, color: '#fff' }}>

          <h1 style={{ color: '#f5c400' }}>Base de Conhecimento</h1>

          {user && (
            <p style={{ color: '#aaa' }}>
              Logado: {user.email}
            </p>
          )}

          <input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
          />

          {/* TOPIC FORM */}
          <div style={styles.box}>
            <h3>Novo Tópico</h3>

            <input
              placeholder="Título"
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              style={styles.input}
            />

            <select
              value={newTopicCategory}
              onChange={(e) => setNewTopicCategory(e.target.value)}
              style={styles.input}
            >
              <option value="">Categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            <button onClick={createTopic} style={styles.btn}>
              Criar
            </button>
          </div>

          {/* TOPICS */}
          {filteredTopics.map((t) => (
            <div key={t.id} style={styles.card}>
              <h3>{t.titulo}</h3>

              <button onClick={() =>
                setSelectedTopic(selectedTopic === t.id ? null : t.id)
              }>
                Comentários
              </button>

              {selectedTopic === t.id && (
                <div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={styles.textarea}
                  />

                  <button onClick={createComment}>
                    Enviar
                  </button>

                  {comments
                    .filter((c) => c.topico_id === t.id)
                    .map((c) => (
                      <div key={c.id}>
                        <p>{c.texto}</p>
                        <button onClick={() => deleteComment(c.id)}>
                          Remover
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}

        </div>

      </Layout>
    </ProtectedRoute>
  );
}

const styles = {
  input: {
    width: '100%',
    padding: 10,
    marginTop: 10,
    background: '#1a1a1a',
    color: '#fff',
    border: '1px solid #333'
  },

  box: {
    marginTop: 20,
    padding: 15,
    background: '#111'
  },

  card: {
    marginTop: 10,
    padding: 10,
    background: '#1a1a1a'
  },

  btn: {
    marginTop: 10,
    background: '#f5c400',
    padding: 10,
    border: 0
  },

  textarea: {
    width: '100%',
    minHeight: 60,
    marginTop: 10
  }
};
