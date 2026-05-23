import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {

  const [user, setUser] = useState(null);

  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);

  const [q, setQ] = useState('');
  const [commentInput, setCommentInput] = useState({});

  const [replyTo, setReplyTo] = useState(null);

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

  // ---------------- CREATE TOPIC ----------------
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

  // ---------------- ADD COMMENT / REPLY ----------------
  async function addComment(topicId) {
    const text = commentInput[topicId];

    if (!text || !text.trim()) return;

    const { error } = await supabase.from('comentarios').insert({
      topic_id: topicId,
      parent_id: replyTo || null,
      texto: text,
      user_email: user?.email,
      created_at: new Date()
    });

    if (error) {
      alert(error.message);
      return;
    }

    setCommentInput(prev => ({ ...prev, [topicId]: '' }));
    setReplyTo(null);
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

  // 🔍 BUSCA GLOBAL
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

  // format data
  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleString('pt-BR');
  }

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
            <div>
              <h3>{t.titulo}</h3>
              <small style={{ color: '#f5c400' }}>
                📂 {t.categoria || 'Sem categoria'}
              </small>
            </div>

            <button onClick={() => deleteTopic(t.id)}>
              Excluir
            </button>
          </div>

          <p>{t.descricao}</p>

          <small style={{ color: '#777' }}>
            criado por: {t.user_email} • {formatDate(t.created_at)}
          </small>

          {/* COMMENTS */}
          {comments
            .filter(c => c.topic_id === t.id && !c.parent_id)
            .map(c => (
              <div key={c.id} style={styles.comment}>

                💬 {c.texto}

                <div style={styles.meta}>
                  <small>{c.user_email}</small>
                  <small>{formatDate(c.created_at)}</small>
                </div>

                <div style={styles.actions}>
                  <button onClick={() => setReplyTo(c.id)}>
                    responder
                  </button>
                  <button onClick={() => deleteComment(c.id)}>
                    excluir
                  </button>
                </div>

                {/* REPLIES */}
                <div style={styles.replyBox}>
                  {comments
                    .filter(r => r.parent_id === c.id)
                    .map(r => (
                      <div key={r.id} style={styles.reply}>
                        ↳ {r.texto}
                        <div style={styles.meta}>
                          <small>{r.user_email}</small>
                          <small>{formatDate(r.created_at)}</small>
                        </div>
                      </div>
                    ))}
                </div>

              </div>
            ))}

          {/* INPUT COMMENT */}
          <div style={styles.row}>
            <input
              placeholder={replyTo ? "Respondendo..." : "Comentar..."}
              value={commentInput[t.id] || ''}
              onChange={e =>
                setCommentInput(prev => ({
                  ...prev,
                  [t.id]: e.target.value
                }))
              }
            />

            {replyTo && (
              <button onClick={() => setReplyTo(null)}>
                cancelar resposta
              </button>
            )}

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

            <textarea
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
    marginTop: 10,
    fontSize: 12,
    color: '#aaa'
  },

  actions: {
    display: 'flex',
    gap: 10,
    marginTop: 5
  },

  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#777'
  },

  row: {
    display: 'flex',
    gap: 10,
    marginTop: 10
  },

  replyBox: {
    marginLeft: 20,
    marginTop: 5
  },

  reply: {
    fontSize: 11,
    color: '#777',
    marginTop: 5
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
