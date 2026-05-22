import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';

import useUser from '../lib/useUser';
import { canCreateTopics } from '../lib/permissions';

export default function BaseConhecimento() {
  const user = useUser();

  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);

  const [selectedTopic, setSelectedTopic] = useState(null);

  const [search, setSearch] = useState('');

  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const c = await supabase.from('categorias').select('*');
    const t = await supabase.from('topicos').select('*');
    const co = await supabase.from('comentarios').select('*');

    setCategories(c.data || []);
    setTopics(t.data || []);
    setComments(co.data || []);
  }

  async function createTopic() {
    if (!user) return;
    if (!canCreateTopics(user)) return;

    await supabase.from('topicos').insert([
      {
        titulo: newTopicTitle,
        categoria_id: newTopicCategory,
        user_id: user.id
      }
    ]);

    setNewTopicTitle('');
    setNewTopicCategory('');
    fetchAll();
  }

  async function createComment() {
    const { data } = await supabase.auth.getUser();
    const u = data?.user;

    if (!u) return;

    await supabase.from('comentarios').insert([
      {
        topico_id: selectedTopic,
        texto: newComment,
        user_id: u.id
      }
    ]);

    setNewComment('');
    fetchAll();
  }

  const filtered = topics.filter(t =>
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
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>

            {user && canCreateTopics(user) && (
              <button onClick={createTopic} style={styles.btn}>
                Criar
              </button>
            )}
          </div>

          {filtered.map(t => (
            <div key={t.id} style={styles.card}>

              <h3 style={{ color: '#f5c400' }}>{t.titulo}</h3>

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
                    .filter(c => c.topico_id === t.id)
                    .map(c => (
                      <div key={c.id}>
                        <p>{c.texto}</p>
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
    color: '#fff'
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
    minHeight: 80,
    marginTop: 10
  }
};
