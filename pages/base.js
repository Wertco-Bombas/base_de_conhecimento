import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {

  const [user, setUser] = useState(null);

  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);
  const [categories, setCategories] = useState([]);

  const [q, setQ] = useState('');

  const [commentInput, setCommentInput] = useState({});

  const [showTopic, setShowTopic] = useState(false);

  const [newTopic, setNewTopic] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });

    load();
  }, []);

  async function load() {
    const { data: t } = await supabase.from('topicos').select('*');
    const { data: c } = await supabase.from('comentarios').select('*');

    setTopics(t || []);
    setComments(c || []);
  }

  async function createTopic() {
    await supabase.from('topicos').insert({
      titulo: newTopic,
      descricao: newDesc,
      categoria: newCat,
      user_email: user?.email,
      created_at: new Date()
    });

    setShowTopic(false);
    load();
  }

  async function addComment(topicId) {
    const text = commentInput[topicId];

    if (!text) return;

    await supabase.from('comentarios').insert({
      topic_id: topicId,
      texto: text,
      user_email: user?.email,
      created_at: new Date()
    });

    setCommentInput(prev => ({ ...prev, [topicId]: '' }));
    load();
  }

  async function deleteTopic(id) {
    await supabase.from('topicos').delete().eq('id', id);
    load();
  }

  async function deleteComment(id) {
    await supabase.from('comentarios').delete().eq('id', id);
    load();
  }

  // 🔍 BUSCA GLOBAL (TOPICOS + COMENTÁRIOS)
  const filteredTopics = topics.filter(t => {
    const topicMatch =
      (t.titulo + t.descricao + t.categoria)
        .toLowerCase()
        .includes(q.toLowerCase());

    const commentMatch = comments.some(c =>
      c.topic_id === t.id &&
      c.texto?.toLowerCase().includes(q.toLowerCase())
    );

    return topicMatch || commentMatch;
  });

  return (
    <Layout>

      {/* SEARCH */}
      <input
        placeholder="Buscar tópicos e comentários..."
        value={q}
        onChange={e => setQ(e.target.value)}
        style={styles.search}
      />

      {/* ACTIONS */}
      <button onClick={() => setShowTopic(true)} style={styles.btn}>
        + Novo Tópico
      </button>

      {/* TOPICS */}
      {filteredTopics.map(t => (
        <div key={t.id} style={styles.card}>

          <div style={styles.header}>
            <h3>{t.titulo}</h3>

            <button onClick={() => deleteTopic(t.id)}>
              Excluir
            </button>
          </div>

          <p>{t.descricao}</p>
          <small>{t.categoria}</small>

          {/* COMMENTS */}
          {comments
            .filter(c => c.topic_id === t.id)
            .map(c => (
              <div key={c.id} style={styles.comment}>
                💬 {c.texto} <br />
                <small>{c.user_email}</small>

                <button onClick={() => deleteComment(c.id)}>
                  x
                </button>
              </div>
            ))}

          {/* ADD COMMENT */}
          <div style={styles.row}>
            <input
              placeholder="Comentar..."
              value={commentInput[t.id] || ''}
              onChange={e =>
                setCommentInput(prev => ({
                  ...prev,
                  [t.id]: e.target.value
                }))
              }
            />

            <button onClick={() => addComment(t.id)}>
              enviar
            </button>
          </div>

        </div>
      ))}

      {/* MODAL TOPIC */}
      {showTopic && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>

            <h3>Novo Tópico</h3>

            <input
              placeholder="Título"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
            />

            <input
              placeholder="Descrição"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />

            <input
              placeholder="Categoria"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
            />

            <button onClick={createTopic}>Salvar</button>
            <button onClick={() => setShowTopic(false)}>Fechar</button>

          </div>
        </div>
      )}

    </Layout>
  );
}

const styles = {
  search: {
    width: '100%',
    padding: 10,
    marginBottom: 20,
    background: '#111',
    color: '#fff'
  },

  btn: {
    marginBottom: 20,
    padding: 10,
    background: '#222',
    color: '#fff'
  },

  card: {
    background: '#111',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  comment: {
    marginTop: 8,
    fontSize: 12,
    color: '#aaa'
  },

  row: {
    display: 'flex',
    gap: 10,
    marginTop: 10
  },

  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  modalBox: {
    background: '#111',
    padding: 20,
    borderRadius: 10,
    width: 400
  }
};
