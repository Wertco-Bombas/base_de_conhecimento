import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { canApprove } from '../lib/permissions';

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
    const { data: t } = await supabase.from('topicos').select('*');
    const { data: cats } = await supabase.from('categorias').select('*');
    const { data: c } = await supabase.from('comentarios').select('*');

    const tFinal = (t || []).map(topic => ({
      ...topic,
      categorias: cats?.find(c => c.id === topic.categoria_id) || null
    }));

    setTopics(tFinal || []);
    setComments(c || []);
  }

  async function addComment(topicId, parentId = null, texto = null) {
    if (!user) return alert('Faça login');

    const text = texto || commentInput[topicId];
    if (!text?.trim()) return;

    const { error } = await supabase.from('comentarios').insert({
      topic_id: topicId,
      parent_id: parentId,
      texto: text,
      user_email: user?.email,
      created_at: new Date().toISOString(),
      status: canApprove(user) ? 'approved' : 'pending'
    });

    if (error) return alert(error.message);

    setCommentInput(prev => ({
      ...prev,
      [topicId]: ''
    }));

    load();
  }

  function buildTree(list, parentId = null, topicId = null) {
    parentId = parentId ? String(parentId) : null;

    return list
      .filter(c =>
        String(c.parent_id ?? null) === String(parentId ?? null) &&
        String(c.topic_id ?? null) === String(topicId ?? null) &&
        (c.status === 'approved' || canApprove(user))
      )
      .map(c => ({
        ...c,
        children: buildTree(list, c.id, topicId) || []
      }));
  }

  const filteredTopics = useMemo(() => {
    return topics.filter(t => {
      const topicMatch =
        `${t.titulo} ${t.descricao} ${t.categorias?.nome || ''}`
          .toLowerCase()
          .includes(q.toLowerCase());

      const commentMatch = comments.some(c =>
        c.topic_id === t.id &&
        c.texto?.toLowerCase().includes(q.toLowerCase())
      );

      return topicMatch || commentMatch;
    });
  }, [topics, comments, q]);

  const visibleTopics = useMemo(() => {
    return filteredTopics.filter(t =>
      t.status === 'approved' || canApprove(user)
    );
  }, [filteredTopics, user]);

  const openReply = useCallback((id) => {
    setReplyInput(prev => ({
      ...prev,
      [id]: prev[id] ?? ''
    }));
  }, []);

  const setReplyValue = useCallback((id, value) => {
    setReplyInput(prev => ({
      ...prev,
      [id]: value
    }));
  }, []);

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleString('pt-BR');
  }

  const CommentNode = memo(function CommentNode({
    comment,
    level = 0
  }) {
    return (
      <div style={{ ...styles.commentBox, marginLeft: level * 25 }}>
        <div style={styles.commentMeta}>
          <span>{comment.user_email || 'Usuário'}</span>
          <span>{formatDate(comment.created_at)}</span>
        </div>

        <div style={styles.commentText}>💬 {comment.texto}</div>

        <div style={styles.commentActions}>
          <button
            style={styles.smallBtn}
            onClick={() => openReply(comment.id)}
          >
            responder
          </button>

          <button
            style={styles.smallBtnDanger}
            onClick={() =>
              supabase.from('comentarios').delete().eq('id', comment.id).then(load)
            }
          >
            excluir
          </button>
        </div>

        {replyInput[comment.id] !== undefined && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <input
              style={styles.input}
              value={replyInput[comment.id]}
              onChange={(e) => setReplyValue(comment.id, e.target.value)}
            />

            <button
              style={styles.mainBtn}
              onClick={() => {
                addComment(comment.topic_id, comment.id, replyInput[comment.id]);

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
          <CommentNode
            key={child.id}
            comment={child}
            level={level + 1}
          />
        ))}
      </div>
    );
  });

  return (
    <Layout>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        style={styles.search}
      />

      {visibleTopics.map(topic => {
        const tree = buildTree(comments, null, topic.id);

        return (
          <div key={topic.id} style={styles.card}>
            <h2>{topic.titulo}</h2>

            {tree.map(comment => (
              <CommentNode key={comment.id} comment={comment} />
            ))}

            <input
              value={commentInput[topic.id] || ''}
              onChange={e =>
                setCommentInput(prev => ({
                  ...prev,
                  [topic.id]: e.target.value
                }))
              }
              style={styles.input}
            />

            <button onClick={() => addComment(topic.id)}>
              enviar
            </button>
          </div>
        );
      })}
    </Layout>
  );
}

const styles = {
  search: { padding: 12 },
  card: { padding: 20, border: '1px solid #333', marginBottom: 20 },
  input: { padding: 10, width: '100%' },
  smallBtn: { marginRight: 8 },
  smallBtnDanger: { color: 'red' },
  commentBox: { marginTop: 16 },
  commentMeta: { fontSize: 12 },
  commentText: { marginTop: 5 },
  commentActions: { display: 'flex', gap: 8 }
};
