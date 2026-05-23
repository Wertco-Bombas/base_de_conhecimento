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

  // ---------------- TOPIC ----------------
  async function createTopic() {
    await supabase.from('topicos').insert({
      titulo: newTopic,
      descricao: newDesc,
      categoria: newCat,
      user_email: user?.email,
      created_at: new Date().toISOString()
    });

    setShowTopic(false);
    load();
  }

  async function deleteTopic(id) {
    await supabase.from('topicos').delete().eq('id', id);
    load();
  }

  // ---------------- COMMENT ----------------
  async function addComment(topicId) {
    const text = commentInput[topicId];

    if (!text || !text.trim()) return;

    await supabase.from('comentarios').insert({
      topic_id: topicId,
      parent_id: replyTo?.commentId || null,
      texto: text,
      user_email: user?.email,
      created_at: new Date().toISOString()
    });

    setCommentInput(prev => ({ ...prev, [topicId]: '' }));
    setReplyTo(null);
    load();
  }

  async function deleteComment(id) {
    await supabase.from('comentarios').delete().eq('id', id);
    load();
  }

  // ---------------- TREE BUILDER ----------------
  function buildTree(list, parentId = null, topicId = null) {
    return list
      .filter(c =>
        c.parent_id === parentId &&
        (topicId ? c.topic_id === topicId : true)
      )
      .map(c => ({
        ...c,
        children: buildTree(list, c.id, topicId)
      }));
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('pt-BR') : '';

  const commentTree = buildTree(comments);

  // ---------------- SEARCH ----------------
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

  // ---------------- COMMENT NODE (RECURSIVO) ----------------
  function CommentNode({ comment }) {
    return (
      <div style={styles.commentBox}>

        <div style={styles.meta}>
          {comment.user_email} • {formatDate(comment.created_at)}
        </div>

        <div>💬 {comment.texto}</div>

        <div style={styles.actions}>
          <button onClick={() =>
            setReplyTo({
              commentId: comment.id,
              topicId: comment.topic_id
            })
          }>
            responder
          </button>

          <button onClick={() => deleteComment(comment.id)}>
            excluir
          </button>
        </div>

        <div style={styles.children}>
          {comment.children?.map(child => (
            <CommentNode key={child.id} comment={child} />
          ))}
        </div>

      </div>
    );
  }

  return (
    <Layout>

      {/* SEARCH */}
      <input
        placeholder="Buscar..."
        value={q}
        onChange={e => setQ(e.target.value)}
        style={styles.search}
      />

      {/* ACTIONS */}
      <button onClick={() => setShowTopic(true)} style={styles.btn}>
        + Novo Tópico
      </button>

      {/* TOPICS */}
      {filteredTopics.map(t => {

        const tree = buildTree(comments, null, t.id);

        return (
          <div key={t.id} style={styles.card}>

            <div style={styles.header}>
              <div>
                <h3>{t.titulo}</h3>
                <small>{t.categoria}</small>
              </div>

              <button onClick={() => deleteTopic(t.id)}>
                excluir
              </button>
            </div>

            <p>{t.descricao}</p>

            <small>
              {t.user_email} • {formatDate(t.created_at)}
            </small>

            {/* COMMENTS TREE */}
            {tree.map(c => (
              <CommentNode key={c.id} comment={c} />
            ))}

            {/* INPUT */}
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
                  cancelar
                </button>
              )}

              <button onClick={() => addComment(t.id)}>
                enviar
              </button>
            </div>

          </div>
        );
      })}

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

  row: {
    display: 'flex',
    gap: 10,
    marginTop: 10
  },

  commentBox: {
    marginLeft: 15,
    marginTop: 10,
    borderLeft: '1px solid #333',
    paddingLeft: 10
  },

  meta: {
    fontSize: 10,
    color: '#777'
  },

  actions: {
    display: 'flex',
    gap: 10,
    marginTop: 5
  },

  children: {
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
