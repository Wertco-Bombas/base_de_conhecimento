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
    loadData();
  }, []);

  async function loadData() {
    const c = await supabase.from('categorias').select('*');
    const t = await supabase.from('topicos').select('*');
    const co = await supabase.from('comentarios').select('*');

    setCategories(c.data || []);
    setTopics(t.data || []);
    setComments(co.data || []);
  }

  async function createTopic() {
    if (!user || !canCreateTopics(user)) return;

    await supabase.from('topicos').insert([
      {
        titulo: newTopicTitle,
        categoria_id: newTopicCategory,
        user_id: user.id
      }
    ]);

    setNewTopicTitle('');
    setNewTopicCategory('');
    loadData();
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
    loadData();
  }

  const filtered = topics.filter(t =>
    t.titulo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <Layout>
        <div style={styles.container}>

          <h1 style={styles.title}>Base de Conhecimento</h1>

          {user && (
            <p style={styles.user}>
              Logado: {user.email}
            </p>
          )}

          <input
            placeholder="Buscar tópicos..."
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
                Criar Tópico
              </button>
            )}
          </div>

          <div style={styles.grid}>
            {filtered.map(t => (
              <div key={t.id} style={styles.card}>

                <h3 style={styles.topicTitle}>{t.titulo}</h3>

                <button
                  style={styles.secondaryBtn}
                  onClick={() =>
                    setSelectedTopic(selectedTopic === t.id ? null : t.id)
                  }
                >
                  Comentários
                </button>

                {selectedTopic === t.id && (
                  <div style={styles.commentBox}>

                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      style={styles.textarea}
                    />

                    <button onClick={createComment} style={styles.btn}>
                      Enviar
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
      </Layout>
    </ProtectedRoute>
  );
}

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    padding: 20,
    background: '#0a0a0a',
    color: '#fff'
  },

  title: {
    color: '#f5c400'
  },

  user: {
    color: '#aaa'
  },

  input: {
    width: '100%',
    padding: 10,
    marginTop: 10,
    background: '#111',
    border: '1px solid #333',
    color: '#fff',
    borderRadius: 8
  },

  box: {
    marginTop: 20,
    padding: 15,
    background: '#111',
    borderRadius: 10
  },

  grid: {
    marginTop: 20,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 10
  },

  card: {
    background: '#1a1a1a',
    padding: 15,
    borderRadius: 10
  },

  topicTitle: {
    color: '#f5c400'
  },

  btn: {
    marginTop: 10,
    background: '#f5c400',
    color: '#000',
    padding: 10,
    border: 0,
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  secondaryBtn: {
    marginTop: 10,
    background: '#222',
    color: '#f5c400',
    border: '1px solid #333',
    padding: 8,
    borderRadius: 8,
    cursor: 'pointer'
  },

  textarea: {
    width: '100%',
    minHeight: 80,
    marginTop: 10,
    background: '#111',
    border: '1px solid #333',
    color: '#fff',
    borderRadius: 8,
    padding: 10
  },

  comment: {
    marginTop: 10,
    padding: 10,
    background: '#222',
    borderRadius: 8
  },

  commentBox: {
    marginTop: 10
  }
};
