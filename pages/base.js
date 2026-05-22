import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';

import { getCurrentUser } from '../lib/auth';
import { canCreateTopics } from '../lib/permissions';
import { logAction } from '../lib/audit';

export default function BaseConhecimento() {
  const [user, setUser] = useState(null);

  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);

  const [selectedTopic, setSelectedTopic] = useState(null);

  const [search, setSearch] = useState('');

  // forms
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('');

  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const u = await getCurrentUser();
    setUser(u);

    fetchCategories();
    fetchTopics();
    fetchComments();
  }

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
     CREATE TOPIC (COM PERMISSÃO + AUDITORIA)
  ========================== */
  async function createTopic() {
    if (!newTopicTitle || !newTopicCategory) return;

    if (!canCreateTopics(user)) {
      alert('Sem permissão para criar tópicos');
      return;
    }

    const { data, error } = await supabase
      .from('topicos')
      .insert([
        {
          titulo: newTopicTitle,
          categoria_id: newTopicCategory,
          user_id: user.id
        }
      ])
      .select()
      .single();

    if (error) {
      alert('Erro ao criar tópico');
      return;
    }

    await logAction({
      user_id: user.id,
      action: 'CREATE_TOPIC',
      entity: 'topicos',
      entity_id: data.id,
      description: `Criou tópico: ${newTopicTitle}`
    });

    setNewTopicTitle('');
    setNewTopicCategory('');
    fetchTopics();
  }

  /* =========================
     CREATE COMMENT (COM AUDITORIA)
  ========================== */
  async function createComment() {
    if (!selectedTopic || !newComment) return;

    const { data } = await supabase.auth.getUser();

    const userId = data?.user?.id;

    await supabase.from('comentarios').insert([
      {
        topico_id: selectedTopic,
        texto: newComment,
        user_id: userId
      }
    ]);

    await logAction({
      user_id: userId,
      action: 'CREATE_COMMENT',
      entity: 'comentarios',
      entity_id: selectedTopic,
      description: 'Criou comentário'
    });

    setNewComment('');
    fetchComments();
  }

  /* =========================
     DELETE COMMENT
  ========================== */
  async function deleteComment(id) {
    await supabase.from('comentarios').delete().eq('id', id);

    await logAction({
      user_id: user?.id,
      action: 'DELETE_COMMENT',
      entity: 'comentarios',
      entity_id: id,
      description: 'Removeu comentário'
    });

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

          {/* USER INFO */}
          {user && (
            <p style={{ color: '#aaa' }}>
              Logado como: {user.email} ({user.role})
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

            <button onClick={createTopic} style={styles.btn}>
              Criar Tópico
            </button>
          </div>

          {/* TOPICS */}
          <div style={styles.grid}>
            {filteredTopics.map((t) => (
              <div key={t.id} style={styles.card}>

                <h3 style={{ color: '#f5c400' }}>{t.titulo}</h3>

                <p style={{ color: '#aaa' }}>
                  Categoria: {t.categoria_id}
                </p>

                <button
                  style={styles.commentBtn}
                  onClick={() =>
                    setSelectedTopic(
                      selectedTopic === t.id ? null : t.id
                    )
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
  container: { padding: '20px', color: '#fff' },
  title: { color: '#f5c400' },

  input: {
    width: '100%',
    padding: '10px',
    marginTop: '10px',
    background: '#1a1a1a',
    border: '1px solid #333',
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
