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
    fetchCategories();
    fetchTopics();
    fetchComments();
  }, []);

  /* =========================
     FETCH
  ========================== */
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
     CREATE TOPIC
  ========================== */
  async function createTopic() {
    if (!newTopicTitle || !newTopicCategory) return;
    if (!user) return;

    if (!canCreateTopics(user)) {
      alert('Sem permissão para criar tópicos');
      return;
    }

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
     CREATE COMMENT
  ========================== */
  async function createComment() {
    if (!selectedTopic || !newComment) return;
    if (!user) return;

    await supabase.from('comentarios').insert([
      {
        topico_id: selectedTopic,
        texto: newComment,
        user_id: user.id
      }
    ]);

    setNewComment('');
    fetchComments();
  }

  /* =========================
     DELETE COMMENT
  ========================== */
  async function deleteComment(id) {
    await supabase.from('comentarios').delete().eq('id', id);
    fetchComments();
  }

  /* =========================
     FILTER
  ========================== */
  const filteredTopics = topics.filter((t) =>
    t.titulo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <Layout>

        <div style={styles.container}>

          <h1 style={styles.title}>Base de Conhecimento</h1>

          {user && (
            <p style={{ color: '#aaa' }}>
              Logado como: {user.email}
            </p>
          )}

          {/* SEARCH */}
          <input
            style={styles.input}
            placeholder="Buscar tópicos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* CREATE TOPIC */}
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
              <option value="">Selecione categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            {/* 🔐 BOTÃO COM PERMISSÃO */}
            {user && canCreateTopics(user) && (
              <button onClick={createTopic} style={styles.btn}>
                Criar Tópico
              </button>
            )}
          </div>

          {/* TOPICS */}
          <div style={styles.grid}>
            {filteredTopics.map((t) => (
              <div key={t.id} style={styles.card}>

                <h3 style={{ color: '#f5c400' }}>{t.titulo}</h3>

                <button
                  style={styles.commentBtn}
                  onClick={() =>
                    setSelectedTopic(selectedTopic === t.id ? null : t.id)
                  }
                >
                  Comentários
                </button>

                {/* COMMENTS */}
                {selectedTopic === t.id && (
                  <div style={styles.commentBox}>

                    <textarea
                      placeholder="Escrever comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      style={styles.textarea}
                    />

                    <button onClick={createComment} style={styles.btn}>
                      Enviar comentário
                    </button>

                    {comments
                      .filter((c) => c.topico_id === t.id)
                      .map((c) => (
                        <div key={c.id} style={styles.comment}>
                          <p>{c.texto}</p>

                          <button
                            onClick={() => deleteComment(c.id)}
                            style={styles.deleteBtn}
                          >
                            Remover
                          </button>
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

/* =========================
   STYLES
========================= */
const styles = {
  container: {
    padding: '20px',
    color: '#fff'
  },

  title: {
    color: '#f5c400'
  },

  input: {
    width: '100%',
    padding: '10px',
    marginTop: '10px',
    background: '#1a1a1a',
    border: '1px solid '#333',
    color: '#fff',
    borderRadius: '8px'
  },

  box: {
    marginTop: '20px',
    padding: '15px',
    background: '#111',
    borderRadius: '10px',
    border: '1px solid #222'
  },

  btn: {
    marginTop: '10px',
    background: '#f5c400',
    border: 'none',
    padding: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  grid: {
    marginTop: '20px',
    display: 'grid',
    gap: '10px'
  },

  card: {
    background: '#1a1a1a',
    padding: '15px',
    borderRadius: '10px'
  },

  commentBtn: {
    marginTop: '10px',
    background: '#333',
    color: '#f5c400',
    border: '1px solid #444',
    padding: '8px',
    borderRadius: '6px',
    cursor: 'pointer'
  },

  commentBox: {
    marginTop: '10px',
    padding: '10px',
    background: '#111',
    borderRadius: '8px'
  },

  textarea: {
    width: '100%',
    minHeight: '80px',
    background: '#1a1a1a',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '10px'
  },

  comment: {
    marginTop: '10px',
    padding: '10px',
    background: '#222',
    borderRadius: '8px'
  },

  deleteBtn: {
    marginTop: '5px',
    background: '#ff4444',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#fff'
  }
};
