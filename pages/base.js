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
     CREATE TOPIC (FIXED)
  ========================== */
  async function createTopic() {
    if (!newTopicTitle || !newTopicCategory) return;

    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

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
     CREATE COMMENT (FIXED)
  ========================== */
  async function createComment() {
    if (!selectedTopic || !newComment) return;

    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;

    if (!userId) {
      alert('Usuário não autenticado');
      return;
    }

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

  async function deleteComment(id) {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;

    await supabase.from('comentarios').delete().eq('id', id);

    await logAction({
      user_id: userId,
      action: 'DELETE_COMMENT',
      entity: 'comentarios',
      entity_id: id,
      description: 'Removeu comentário'
    });

    fetchComments();
  }

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

          <input
            style={styles.input}
            placeholder="Buscar tópicos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
