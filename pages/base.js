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

  // fundo geral do card de tópico
  card: {
    background: '#0f0f10',
    border: '1px solid #1f1f22',
    padding: 18,
    marginBottom: 14,
    borderRadius: 12,
    boxShadow: '0 0 0 1px rgba(255,255,255,0.02)'
  },

  // título do header do tópico
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },

  // input de busca
  search: {
    width: '100%',
    padding: 12,
    marginBottom: 18,
    background: '#0b0b0c',
    border: '1px solid #2a2a2e',
    color: '#fff',
    borderRadius: 10,
    outline: 'none'
  },

  // botão padrão
  btn: {
    marginBottom: 18,
    padding: '10px 14px',
    background: '#1a1a1d',
    color: '#fff',
    border: '1px solid #2a2a2e',
    borderRadius: 10,
    cursor: 'pointer'
  },

  // linha de input comentário
  row: {
    display: 'flex',
    gap: 10,
    marginTop: 12
  },

  // input comentário
  input: {
    flex: 1,
    padding: 10,
    background: '#0b0b0c',
    border: '1px solid #2a2a2e',
    color: '#fff',
    borderRadius: 10,
    outline: 'none'
  },

  // comentário principal
  commentBox: {
    marginLeft: 14,
    marginTop: 10,
    padding: 10,
    borderLeft: '2px solid #2a2a2e',
    background: '#0b0b0c',
    borderRadius: 10
  },

  // metadata (user + data)
  meta: {
    fontSize: 11,
    color: '#8a8a8a',
    marginBottom: 6,
    display: 'flex',
    justifyContent: 'space-between'
  },

  // botões de ação
  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 8
  },

  // replies
  children: {
    marginTop: 10
  },

  // modal overlay
  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  // modal box
  modalBox: {
    background: '#0f0f10',
    padding: 20,
    borderRadius: 14,
    width: 420,
    border: '1px solid #2a2a2e',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },

  // categoria pequena
  category: {
    fontSize: 12,
    color: '#f5c400',
    marginTop: 4
  }
};
