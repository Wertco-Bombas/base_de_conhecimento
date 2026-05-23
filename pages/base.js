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

  async function addComment(topicId) {
    const text = commentInput[topicId];
    if (!text?.trim()) return;

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

  async function deleteTopic(id) {
    await supabase.from('topicos').delete().eq('id', id);
    load();
  }

  async function deleteComment(id) {
    await supabase.from('comentarios').delete().eq('id', id);
    load();
  }

  function buildTree(list, parentId = null, topicId = null) {
    return list
      .filter(c => c.parent_id === parentId && c.topic_id === topicId)
      .map(c => ({
        ...c,
        children: buildTree(list, c.id, topicId)
      }));
  }

  const filteredTopics = topics.filter(t =>
    (t.titulo + t.descricao + t.categoria)
      .toLowerCase()
      .includes(q.toLowerCase())
  );

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('pt-BR') : '';

  function CommentNode({ comment }) {
    return (
      <div style={styles.commentBox}>

        <div style={styles.meta}>
          <span>{comment.user_email}</span>
          <span>{formatDate(comment.created_at)}</span>
        </div>

        <div style={styles.commentText}>
          💬 {comment.texto}
        </div>

        <div style={styles.actions}>
          <button style={styles.smallBtn}
            onClick={() => setReplyTo({ commentId: comment.id })}
          >
            responder
          </button>

          <button style={styles.smallBtn}
            onClick={() => deleteComment(comment.id)}
          >
            excluir
          </button>
        </div>

        {comment.children?.length > 0 && (
          <div style={styles.children}>
            {comment.children.map(c => (
              <CommentNode key={c.id} comment={c} />
            ))}
          </div>
        )}

      </div>
    );
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

      {/* NEW TOPIC BTN */}
      <button style={styles.mainBtn} onClick={() => setShowTopic(true)}>
        + Novo Tópico
      </button>

      {/* TOPICS */}
      {filteredTopics.map(t => {

        const tree = buildTree(comments, null, t.id);

        return (
          <div key={t.id} style={styles.card}>

            <div style={styles.header}>
              <div>
                <h3 style={styles.title}>{t.titulo}</h3>
                <div style={styles.category}>{t.categoria}</div>
              </div>

              <button style={styles.smallBtn} onClick={() => deleteTopic(t.id)}>
                excluir
              </button>
            </div>

            <p style={styles.desc}>{t.descricao}</p>

            <div style={styles.meta}>
              <span>{t.user_email}</span>
              <span>{formatDate(t.created_at)}</span>
            </div>

            <div style={{ marginTop: 15 }}>
              {tree.map(c => (
                <CommentNode key={c.id} comment={c} />
              ))}
            </div>

            {/* COMMENT INPUT */}
            <div style={styles.row}>
              <input
                placeholder="Escreva um comentário..."
                value={commentInput[t.id] || ''}
                onChange={e =>
                  setCommentInput(prev => ({
                    ...prev,
                    [t.id]: e.target.value
                  }))
                }
                style={styles.input}
              />

              <button style={styles.mainBtn} onClick={() => addComment(t.id)}>
                enviar
              </button>
            </div>

          </div>
        );
      })}

      {/* MODAL */}
      {showTopic && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>

            <h3 style={{ color: '#FFD000' }}>Novo Tópico</h3>

            <input style={styles.input}
              placeholder="Título"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
            />

            <textarea style={styles.input}
              placeholder="Descrição"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />

            <input style={styles.input}
              placeholder="Categoria"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
            />

            <button style={styles.mainBtn} onClick={createTopic}>
              salvar
            </button>

            <button style={styles.smallBtn} onClick={() => setShowTopic(false)}>
              fechar
            </button>

          </div>
        </div>
      )}

    </Layout>
  );
}

/* ---------------- WERTCO STYLE ---------------- */

const styles = {

  search: {
    width: '100%',
    padding: 12,
    marginBottom: 20,
    background: '#0b0b0c',
    border: '1px solid #2a2a2e',
    color: '#fff',
    borderRadius: 10,
    fontFamily: 'Inter, system-ui, sans-serif'
  },

  card: {
    background: '#0c0c0d',
    border: '1px solid #1f1f22',
    padding: 18,
    marginBottom: 14,
    borderRadius: 14,
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#fff'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  title: {
    margin: 0,
    color: '#fff',
    fontSize: 18
  },

  category: {
    color: '#FFD000',
    fontSize: 12,
    marginTop: 4
  },

  desc: {
    color: '#bbb',
    marginTop: 10
  },

  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: '#777',
    marginTop: 8
  },

  row: {
    display: 'flex',
    gap: 10,
    marginTop: 12
  },

  input: {
    width: '100%',
    padding: 10,
    background: '#0b0b0c',
    border: '1px solid #2a2a2e',
    color: '#fff',
    borderRadius: 10,
    fontFamily: 'Inter, system-ui, sans-serif'
  },

  mainBtn: {
    background: '#FFD000',
    color: '#000',
    border: 'none',
    padding: '10px 14px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  smallBtn: {
    background: 'transparent',
    color: '#FFD000',
    border: '1px solid #FFD000',
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12
  },

  commentBox: {
    marginLeft: 16,
    marginTop: 10,
    padding: 10,
    borderLeft: '2px solid #FFD000'
  },

  commentText: {
    color: '#ddd',
    marginTop: 4
  },

  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 6
  },

  children: {
    marginTop: 10
  },

  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  modalBox: {
    width: 420,
    background: '#0c0c0d',
    padding: 20,
    borderRadius: 14,
    border: '1px solid #FFD000',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    fontFamily: 'Inter, system-ui, sans-serif'
  }
};
