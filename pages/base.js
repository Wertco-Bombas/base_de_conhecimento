import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {

  const [user, setUser] = useState(null);

  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);

  const [q, setQ] = useState('');
  const [commentInput, setCommentInput] = useState({});

  // RESPOSTA
  const [replyTo, setReplyTo] = useState(null);

  // MODAL
  const [showTopic, setShowTopic] = useState(false);

  // FORM TOPIC
  const [newTopic, setNewTopic] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState('');

  // ---------------- LOAD ----------------
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
      .order('created_at', { ascending: false });

    const { data: c } = await supabase
      .from('comentarios')
      .select('*')
      .order('created_at', { ascending: true });

    setTopics(t || []);
    setComments(c || []);
  }

  // ---------------- TOPIC ----------------
  async function createTopic() {

    if (!newTopic || !newCat) return;

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

  async function deleteTopic(id) {

    await supabase
      .from('topicos')
      .delete()
      .eq('id', id);

    load();
  }

  // ---------------- COMMENT ----------------
  async function addComment(topicId) {

    const text = commentInput[topicId];

    if (!text?.trim()) return;

    const finalTopicId =
      replyTo?.topicId || topicId;

    const finalParentId =
      replyTo?.commentId || null;

    const { error } = await supabase
      .from('comentarios')
      .insert({
        topic_id: finalTopicId,
        parent_id: finalParentId,
        texto: text,
        user_email: user?.email,
        created_at: new Date().toISOString()
      });

    if (error) {
      alert(error.message);
      return;
    }

    setCommentInput(prev => ({
      ...prev,
      [topicId]: ''
    }));

    setReplyTo(null);

    load();
  }

  async function deleteComment(id) {

    await supabase
      .from('comentarios')
      .delete()
      .eq('id', id);

    load();
  }

  // ---------------- TREE ----------------
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

  // ---------------- SEARCH ----------------
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

  // ---------------- DATE ----------------
  const formatDate = (d) => {

    if (!d) return '';

    return new Date(d).toLocaleString('pt-BR');
  };

  // ---------------- COMMENT NODE ----------------
  function CommentNode({ comment }) {

    return (

      <div style={styles.commentBox}>

        {/* META */}
        <div style={styles.meta}>

          <span>
            {comment.user_email}
          </span>

          <span>
            {formatDate(comment.created_at)}
          </span>

        </div>

        {/* TEXT */}
        <div style={styles.commentText}>
          💬 {comment.texto}
        </div>

        {/* ACTIONS */}
        <div style={styles.actions}>

          <button
            style={styles.smallBtn}
            onClick={() =>
              setReplyTo({
                commentId: comment.id,
                topicId: comment.topic_id
              })
            }
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

        {/* CHILDREN */}
        {comment.children?.length > 0 && (

          <div style={styles.children}>

            {comment.children.map(child => (
              <CommentNode
                key={child.id}
                comment={child}
              />
            ))}

          </div>

        )}

      </div>
    );
  }

  return (

    <Layout>

      <div style={styles.container}>

        {/* SEARCH */}
        <input
          placeholder="Buscar tópicos e comentários..."
          value={q}
          onChange={e => setQ(e.target.value)}
          style={styles.search}
        />

        {/* ACTIONS */}
        <div style={styles.topActions}>

          <button
            style={styles.mainBtn}
            onClick={() => setShowTopic(true)}
          >
            + Novo Tópico
          </button>

        </div>

        {/* TOPICS */}
        {filteredTopics.map(topic => {

          const tree =
            buildTree(comments, null, topic.id);

          return (

            <div
              key={topic.id}
              style={styles.card}
            >

              {/* HEADER */}
              <div style={styles.header}>

                <div>

                  <h2 style={styles.title}>
                    {topic.titulo}
                  </h2>

                  <div style={styles.category}>
                    {topic.categoria}
                  </div>

                </div>

                <button
                  style={styles.smallBtnDanger}
                  onClick={() => deleteTopic(topic.id)}
                >
                  excluir tópico
                </button>

              </div>

              {/* DESC */}
              <p style={styles.desc}>
                {topic.descricao}
              </p>

              {/* META */}
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

              {/* REPLY INFO */}
              {replyTo && (
                <div style={styles.replying}>
                  Respondendo comentário...
                </div>
              )}

              {/* ADD COMMENT */}
              <div style={styles.row}>

                <input
                  placeholder="Escreva um comentário..."
                  value={commentInput[topic.id] || ''}
                  onChange={e =>
                    setCommentInput(prev => ({
                      ...prev,
                      [topic.id]: e.target.value
                    }))
                  }
                  style={styles.input}
                />

                {replyTo && (

                  <button
                    style={styles.smallBtn}
                    onClick={() => setReplyTo(null)}
                  >
                    cancelar
                  </button>

                )}

                <button
                  style={styles.mainBtn}
                  onClick={() => addComment(topic.id)}
                >
                  enviar
                </button>

              </div>

            </div>
          );
        })}

      </div>

      {/* MODAL */}
      {showTopic && (

        <div style={styles.modal}>

          <div style={styles.modalBox}>

            <h2 style={{ color: '#FFD000' }}>
              Novo Tópico
            </h2>

            <input
              style={styles.input}
              placeholder="Título"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
            />

            <textarea
              style={styles.textarea}
              placeholder="Descrição"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Categoria"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
            />

            <button
              style={styles.mainBtn}
              onClick={createTopic}
            >
              salvar
            </button>

            <button
              style={styles.smallBtn}
              onClick={() => setShowTopic(false)}
            >
              fechar
            </button>

          </div>

        </div>

      )}

    </Layout>
  );
}

// ---------------- STYLES ----------------

const styles = {

  container: {
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#fff'
  },

  search: {
    width: '100%',
    padding: 14,
    marginBottom: 20,
    background: '#0d0d0f',
    border: '1px solid #2b2b31',
    color: '#fff',
    borderRadius: 12,
    fontSize: 14
  },

  topActions: {
    marginBottom: 20
  },

  mainBtn: {
    background: '#FFD000',
    color: '#000',
    border: 'none',
    padding: '10px 16px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  smallBtn: {
    background: 'transparent',
    border: '1px solid #FFD000',
    color: '#FFD000',
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12
  },

  smallBtnDanger: {
    background: '#1a1a1a',
    border: '1px solid #ff4d4f',
    color: '#ff4d4f',
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12
  },

  card: {
    background: '#111214',
    border: '1px solid #222',
    borderRadius: 16,
    padding: 20,
    marginBottom: 18
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },

  title: {
    margin: 0,
    color: '#fff',
    fontSize: 22
  },

  category: {
    marginTop: 6,
    color: '#FFD000',
    fontSize: 12,
    fontWeight: 'bold'
  },

  desc: {
    color: '#bdbdbd',
    marginTop: 15,
    lineHeight: 1.5
  },

  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 12,
    fontSize: 11,
    color: '#777'
  },

  row: {
    display: 'flex',
    gap: 10,
    marginTop: 18
  },

  input: {
    flex: 1,
    background: '#0d0d0f',
    border: '1px solid #2b2b31',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    outline: 'none'
  },

  textarea: {
    width: '100%',
    minHeight: 100,
    background: '#0d0d0f',
    border: '1px solid #2b2b31',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    outline: 'none'
  },

  commentBox: {
    marginLeft: 16,
    marginTop: 14,
    paddingLeft: 14,
    borderLeft: '2px solid #FFD000'
  },

  commentText: {
    color: '#e4e4e4',
    marginTop: 5,
    lineHeight: 1.5
  },

  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 8
  },

  children: {
    marginTop: 12
  },

  replying: {
    color: '#FFD000',
    marginTop: 15,
    fontSize: 13
  },

  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.82)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  modalBox: {
    width: 450,
    background: '#111214',
    border: '1px solid #FFD000',
    borderRadius: 16,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 14
  }

};
