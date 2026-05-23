import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {

  const [user, setUser] = useState(null);

  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);

  const [q, setQ] = useState('');
  const [commentInput, setCommentInput] = useState({});
  const [replyInput, setReplyInput] = useState({});

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

    const { data: catData, error: catError } = await supabase
      .from('categorias')
      .select('id')
      .eq('nome', newCat)
      .single();

    if (catError || !catData) {
      alert('Categoria não encontrada');
      return;
    }

    const { data, error } = await supabase
      .from('topicos')
      .insert({
        titulo: newTopic,
        descricao: newDesc,
        categoria_id: catData.id,
        user_email: user?.email,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) return alert(error.message);

    setTopics(prev => [data, ...prev]);

    setNewTopic('');
    setNewDesc('');
    setNewCat('');
    setShowTopic(false);
  }

  async function addComment(topicId, parentId = null, texto = null) {

    const text = texto || commentInput[topicId];

    if (!text?.trim()) return;

    const { data, error } = await supabase
      .from('comentarios')
      .insert({
        topic_id: topicId,
        parent_id: parentId,
        texto: text,
        user_email: user?.email,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) return alert(error.message);

    setComments(prev => [...prev, data]);

    setCommentInput(prev => ({
      ...prev,
      [topicId]: ''
    }));
  }

  async function deleteComment(id) {

    const ok = confirm('Excluir comentário?');
    if (!ok) return;

    await supabase
      .from('comentarios')
      .delete()
      .eq('id', id);

    setComments(prev => prev.filter(c => c.id !== id));
  }

  async function deleteTopic(id) {

    const ok = confirm('Excluir tópico?');
    if (!ok) return;

    await supabase
      .from('topicos')
      .delete()
      .eq('id', id);

    setTopics(prev => prev.filter(t => t.id !== id));
    setComments(prev => prev.filter(c => c.topic_id !== id));
  }

  function buildTree(list, parentId = null, topicId = null) {

    return list
      .filter(c => c.parent_id === parentId && c.topic_id === topicId)
      .map(c => ({
        ...c,
        children: buildTree(list, c.id, topicId)
      }));
  }

  const filteredTopics = useMemo(() => {

    return topics.filter(t => {

      const topicMatch =
        `${t.titulo} ${t.descricao}`
          .toLowerCase()
          .includes(q.toLowerCase());

      const commentMatch = comments.some(c =>
        c.topic_id === t.id &&
        c.texto?.toLowerCase().includes(q.toLowerCase())
      );

      return topicMatch || commentMatch;
    });

  }, [topics, comments, q]);

  function formatDate(date) {
    return date ? new Date(date).toLocaleString('pt-BR') : '';
  }

  const CommentNode = useMemo(() => {

    function Node({ comment, level = 0 }) {

      const hasReply = replyInput.hasOwnProperty(comment.id);

      return (
        <div style={{ ...styles.commentBox, marginLeft: level * 25 }}>

          <div style={styles.commentMeta}>
            <span>{comment.user_email}</span>
            <span>{formatDate(comment.created_at)}</span>
          </div>

          <div style={styles.commentText}>
            💬 {comment.texto}
          </div>

          <div style={styles.commentActions}>

            <button
              style={styles.smallBtn}
              onClick={() => {
                setReplyInput(prev => ({
                  ...prev,
                  [comment.id]: ''
                }));
              }}
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

          {hasReply && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>

              <input
                style={styles.input}
                value={replyInput[comment.id] || ''}
                placeholder="Responder..."
                onChange={(e) =>
                  setReplyInput(prev => ({
                    ...prev,
                    [comment.id]: e.target.value
                  }))
                }
              />

              <button
                style={styles.mainBtn}
                onClick={async () => {

                  await addComment(
                    comment.topic_id,
                    comment.id,
                    replyInput[comment.id]
                  );

                  setReplyInput(prev => ({
                    ...prev,
                    [comment.id]: ''
                  }));
                }}
              >
                enviar
              </button>

            </div>
          )}

          {comment.children?.map(child => (
            <Node key={child.id} comment={child} level={level + 1} />
          ))}

        </div>
      );
    }

    return Node;

  }, [replyInput, comments]);

  return (
    <Layout>

      <input
        placeholder="Buscar..."
        value={q}
        onChange={e => setQ(e.target.value)}
        style={styles.search}
      />

      <div style={styles.topBar}>

        <button style={styles.mainBtn} onClick={() => setShowTopic(true)}>
          + Novo Tópico
        </button>

      </div>

      {filteredTopics.map(topic => {

        const tree = useMemo(() =>
          buildTree(comments, null, topic.id),
          [comments, topic.id]
        );

        return (
          <div key={topic.id} style={styles.card}>

            <h2>{topic.titulo}</h2>

            <p>{topic.descricao}</p>

            <div style={{ marginTop: 20 }}>
              {tree.map(comment => (
                <CommentNode key={comment.id} comment={comment} />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>

              <input
                style={styles.input}
                value={commentInput[topic.id] || ''}
                onChange={(e) =>
                  setCommentInput(prev => ({
                    ...prev,
                    [topic.id]: e.target.value
                  }))
                }
              />

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

    </Layout>
  );
}

const styles = {
  search: { width: '100%', padding: 12, marginBottom: 20 },
  card: { padding: 20, border: '1px solid #333', marginBottom: 20 },
  input: { flex: 1, padding: 10 },
  mainBtn: { padding: 10, background: '#FFD600' },
  smallBtn: { marginRight: 8 },
  smallBtnDanger: { color: 'red' },
  commentBox: { padding: 10, borderLeft: '2px solid #FFD600' },
  commentMeta: { fontSize: 12, opacity: 0.7 },
  commentText: { marginTop: 5 },
  commentActions: { display: 'flex', gap: 8, marginTop: 5 },
  topBar: { marginBottom: 20 }
};
