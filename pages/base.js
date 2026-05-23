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

    const { data: t } = await supabase
      .from('topicos')
      .select('*')
      .order('id', { ascending: false });

    const { data: c } = await supabase
      .from('comentarios')
      .select('*')
      .order('id', { ascending: true });

    setTopics(t || []);
    setComments(c || []);
  }

  async function createTopic() {

    if (!newTopic || !newCat) {
      alert('Preencha título e categoria');
      return;
    }

    const { error } = await supabase
      .from('topicos')
      .insert({
        titulo: newTopic,
        descricao: newDesc,
        categoria: newCat,
        user_email: user?.email,
        created_at: new Date().toISOString()
      });

    if (error) {
      alert(error.message);
      return;
    }

    setNewTopic('');
    setNewDesc('');
    setNewCat('');

    setShowTopic(false);

    load();
  }

  async function addComment(topicId, parentId = null, texto = null) {

    const text = texto || commentInput[topicId];

    if (!text?.trim()) return;

    const { error } = await supabase
      .from('comentarios')
      .insert({
        topic_id: topicId,
        parent_id: parentId,
        texto: text,
        user_email: user?.email,
        created_at: new Date().toISOString()
      });

    if (error) {
      alert("Erro ao salvar comentário: " + error.message);
      return;
    }

    setCommentInput(prev => ({
      ...prev,
      [topicId]: ''
    }));

    setReplyTo(null);

    load();
  }

  async function deleteTopic(id) {
    const confirmar = confirm('Excluir tópico?');
    if (!confirmar) return;

    await supabase.from('topicos').delete().eq('id', id);
    load();
  }

  async function deleteComment(id) {
    const confirmar = confirm('Excluir comentário?');
    if (!confirmar) return;

    await supabase.from('comentarios').delete().eq('id', id);
    load();
  }

  function buildTree(list, parentId = null, topicId = null) {

    return list
      .filter(c =>
        c.parent_id === parentId &&
        c.topic_id === topicId
      )
      .map(c => ({
        ...c,
        children: buildTree(list, c.id, topicId)
      }));
  }

  const filteredTopics = topics.filter(t => {

    const topicMatch =
      `${t.titulo} ${t.descricao} ${t.categoria}`
        .toLowerCase()
        .includes(q.toLowerCase());

    const commentMatch = comments.some(c =>
      c.topic_id === t.id &&
      c.texto?.toLowerCase().includes(q.toLowerCase())
    );

    return topicMatch || commentMatch;
  });

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleString('pt-BR');
  }

  function CommentNode({ comment, level = 0 }) {

    const isReplying = replyTo?.id === comment.id;

    return (
      <div
        style={{
          ...styles.commentBox,
          marginLeft: level * 25,
          borderLeft: isReplying ? '2px solid #FFD600' : styles.commentBox.borderLeft
        }}
      >

        <div style={styles.commentMeta}>
          <span>{comment.user_email || 'Usuário'}</span>
          <span>{formatDate(comment.created_at)}</span>
        </div>

        <div style={styles.commentText}>
          💬 {comment.texto}
        </div>

        <div style={styles.commentActions}>

          <button
            style={styles.smallBtn}
            onClick={() => setReplyTo(comment)}
          >
            responder
          </button>

          <button
            style={styles.smallBtnDanger}
            onClick={() => deleteComment(comment.id)}
          >
            excluir
          </button>

        </div>

        {comment.children?.length > 0 && (
          <div>
            {comment.children.map(child => (
              <CommentNode
                key={child.id}
                comment={child}
                level={level + 1}
              />
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

      {/* TOP BUTTONS */}
      <div style={styles.topBar}>

        <button
          style={styles.mainBtn}
          onClick={() => setShowTopic(true)}
        >
          + Novo Tópico
        </button>

      </div>

      {/* FEEDBACK DE RESPOSTA */}
      {replyTo && (
        <div style={styles.replyBanner}>
          Respondendo: <b>{replyTo.texto}</b>
          <button onClick={() => setReplyTo(null)}>cancelar</button>
        </div>
      )}

      {/* TOPICS */}
      {filteredTopics.map(topic => {

        const tree = buildTree(comments, null, topic.id);

        return (
          <div key={topic.id} style={styles.card}>

            <div style={styles.header}>
              <div>
                <h2 style={styles.title}>{topic.titulo}</h2>
                <div style={styles.category}>{topic.categoria}</div>
              </div>

              <button
                style={styles.smallBtnDanger}
                onClick={() => deleteTopic(topic.id)}
              >
                excluir tópico
              </button>
            </div>

            <p style={styles.desc}>{topic.descricao}</p>

            <div style={styles.meta}>
              <span>{topic.user_email}</span>
              <span>{formatDate(topic.created_at)}</span>
            </div>

            {/* COMMENTS */}
            <div style={{ marginTop: 20 }}>
              {tree.map(comment => (
                <CommentNode
                  key={comment.id}
                  comment={comment}
                />
              ))}
            </div>

            {/* ADD COMMENT */}
            <div style={styles.row}>

              <input
                placeholder={
                  replyTo ? "Respondendo comentário..." : "Escreva um comentário..."
                }
                value={commentInput[topic.id] || ''}
                onChange={e =>
                  setCommentInput(prev => ({
                    ...prev,
                    [topic.id]: e.target.value
                  }))
                }
                style={styles.input}
              />

              <button
                style={styles.mainBtn}
                onClick={() =>
                  addComment(
                    topic.id,
                    replyTo?.id || null
                  )
                }
              >
                enviar
              </button>

            </div>

          </div>
        );
      })}

    </Layout>
  );
}

/* STYLE EXTRA */

const styles = {

  replyBanner: {
    background: '#FFD600',
    color: '#000',
    padding: 10,
    marginBottom: 15,
    borderRadius: 10,
    display: 'flex',
    justifyContent: 'space-between'
  },

  topBar: {
    display: 'flex',
    gap: 10,
    marginBottom: 20
  },

  search: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    border: '1px solid #2a2a2a',
    background: '#0b0b0b',
    color: '#fff',
    marginBottom: 20
  },

  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    color: '#fff'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  title: { margin: 0, fontSize: 22 },

  category: {
    color: '#FFD600',
    fontSize: 12,
    marginTop: 5
  },

  desc: {
    color: '#bbb',
    marginTop: 10
  },

  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 10,
    fontSize: 12,
    color: '#777'
  },

  row: {
    display: 'flex',
    gap: 10,
    marginTop: 20
  },

  input: {
    flex: 1,
    background: '#0b0b0b',
    border: '1px solid #2a2a2a',
    color: '#fff',
    padding: 12,
    borderRadius: 10
  },

  mainBtn: {
    background: '#FFD600',
    color: '#000',
    border: 'none',
    padding: '10px 14px',
    borderRadius: 10,
    cursor: 'pointer'
  },

  smallBtnDanger: {
    background: 'transparent',
    border: '1px solid #ff4d4d',
    color: '#ff4d4d',
    padding: '6px 10px',
    borderRadius: 10,
    cursor: 'pointer'
  },

  commentBox: {
    marginTop: 12,
    padding: 12,
    borderLeft: '2px solid #FFD600',
    background: '#0d0d0d',
    borderRadius: 10
  },

  commentMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: '#888'
  },

  commentText: {
    marginTop: 8
  },

  commentActions: {
    display: 'flex',
    gap: 8,
    marginTop: 10
  }
};
