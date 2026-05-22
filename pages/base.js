import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [user, setUser] = useState(null);

  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);

  const [selectedTopic, setSelectedTopic] = useState(null);

  // MODALS
  const [showCatModal, setShowCatModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);

  // FORM CATEGORY
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // FORM TOPIC
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [topicCategory, setTopicCategory] = useState('');

  // COMMENT
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const u = await supabase.auth.getUser();
    setUser(u.data?.user);

    load();
  }

  async function load() {
    const c = await supabase.from('categorias').select('*');
    const t = await supabase.from('topicos').select('*');
    const cm = await supabase.from('comentarios').select('*');

    setCategories(c.data || []);
    setTopics(t.data || []);
    setComments(cm.data || []);
  }

  /* =========================
     CATEGORY
  ========================== */

  async function createCategory() {
    await supabase.from('categorias').insert([
      {
        nome: catName,
        descricao: catDesc
      }
    ]);

    setCatName('');
    setCatDesc('');
    setShowCatModal(false);
    load();
  }

  /* =========================
     TOPIC
  ========================== */

  async function createTopic() {
    const { data } = await supabase.auth.getUser();

    await supabase.from('topicos').insert([
      {
        titulo: topicTitle,
        descricao: topicDesc,
        categoria_id: topicCategory,
        user_id: data.user.id,
        created_at: new Date()
      }
    ]);

    setTopicTitle('');
    setTopicDesc('');
    setTopicCategory('');
    setShowTopicModal(false);
    load();
  }

  /* =========================
     COMMENT (FIX)
  ========================== */

  async function createComment(topicId) {
    const { data } = await supabase.auth.getUser();

    if (!commentText) return;

    await supabase.from('comentarios').insert([
      {
        topico_id: topicId,
        texto: commentText,
        user_id: data.user.id
      }
    ]);

    setCommentText('');
    load();
  }

  return (
    <ProtectedRoute>
      <Layout>

        <div style={styles.container}>

          <h1 style={styles.title}>Base de Conhecimento</h1>

          {/* ACTION BUTTONS */}
          <div style={styles.actions}>

            <button onClick={() => setShowCatModal(true)} style={styles.btn}>
              Nova Categoria
            </button>

            <button onClick={() => setShowTopicModal(true)} style={styles.btn}>
              Novo Tópico
            </button>

          </div>

          {/* TOPICS */}
          <div style={styles.list}>

            {topics.map(t => {

              const cat = categories.find(c => c.id === t.categoria_id);

              return (
                <div key={t.id} style={styles.card}>

                  <h3 style={{ color: '#f5c400' }}>{t.titulo}</h3>

                  <p>{t.descricao}</p>

                  <p style={{ color: '#aaa' }}>
                    Categoria: {cat?.nome}
                  </p>

                  <p style={{ fontSize: 12, color: '#888' }}>
                    Criado por: {t.user_id} <br />
                    {new Date(t.created_at).toLocaleString()}
                  </p>

                  <button
                    onClick={() =>
                      setSelectedTopic(selectedTopic === t.id ? null : t.id)
                    }
                    style={styles.commentBtn}
                  >
                    Comentários
                  </button>

                  {/* COMMENTS */}
                  {selectedTopic === t.id && (
                    <div style={styles.comments}>

                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        style={styles.textarea}
                      />

                      <button
                        onClick={() => createComment(t.id)}
                        style={styles.btn}
                      >
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
              );
            })}

          </div>

          {/* ================= MODAL CATEGORY ================= */}
          {showCatModal && (
            <Modal onClose={() => setShowCatModal(false)}>
              <h3>Nova Categoria</h3>

              <input
                placeholder="Nome"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                style={styles.input}
              />

              <textarea
                placeholder="Descrição"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                style={styles.textarea}
              />

              <button onClick={createCategory} style={styles.btn}>
                Criar
              </button>
            </Modal>
          )}

          {/* ================= MODAL TOPIC ================= */}
          {showTopicModal && (
            <Modal onClose={() => setShowTopicModal(false)}>
              <h3>Novo Tópico</h3>

              <input
                placeholder="Título"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                style={styles.input}
              />

              <textarea
                placeholder="Descrição"
                value={topicDesc}
                onChange={(e) => setTopicDesc(e.target.value)}
                style={styles.textarea}
              />

              <select
                value={topicCategory}
                onChange={(e) => setTopicCategory(e.target.value)}
                style={styles.input}
              >
                <option value="">Selecione categoria</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>

              <button onClick={createTopic} style={styles.btn}>
                Criar
              </button>
            </Modal>
          )}

        </div>

      </Layout>
    </ProtectedRoute>
  );
}

/* ================= MODAL ================= */

function Modal({ children, onClose }) {
  return (
    <div style={styles.modalBg} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: { padding: 20, color: '#fff' },

  title: { color: '#f5c400' },

  actions: { display: 'flex', gap: 10 },

  btn: {
    background: '#f5c400',
    border: 0,
    padding: 10,
    borderRadius: 8,
    cursor: 'pointer'
  },

  input: {
    width: '100%',
    padding: 10,
    marginTop: 10,
    background: '#111',
    color: '#fff',
    border: '1px solid #333'
  },

  textarea: {
    width: '100%',
    minHeight: 80,
    marginTop: 10,
    background: '#111',
    color: '#fff'
  },

  list: { marginTop: 20 },

  card: {
    padding: 15,
    marginTop: 10,
    background: '#111',
    borderRadius: 10
  },

  commentBtn: {
    marginTop: 10,
    background: '#333',
    color: '#f5c400',
    border: 0,
    padding: 8,
    borderRadius: 6
  },

  comments: { marginTop: 10 },

  comment: {
    padding: 8,
    borderBottom: '1px solid #222'
  },

  modalBg: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  modal: {
    background: '#111',
    padding: 20,
    borderRadius: 10,
    width: 400
  }
};
