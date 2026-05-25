import { useEffect, useState, useMemo, memo } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { canApprove } from '../lib/permissions';

export default function Base() {
  const [user, setUser] = useState(null);
  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);
  const [categories, setCategories] = useState([]);

  const [q, setQ] = useState('');
  const [commentInput, setCommentInput] = useState({});
  const [replyInput, setReplyInput] = useState({});

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const [showTopic, setShowTopic] = useState(false);

  const [showDeleteCategory, setShowDeleteCategory] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

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
    setCategories(cats || []);
  }

  async function createTopic() {
    if (!user) return alert('Faça login');

    if (!newTopic || !newCat) {
      return alert('Preencha título e categoria');
    }

    const { data: catData, error: catError } = await supabase
      .from('categorias')
      .select('id')
      .eq('nome', newCat)
      .single();

    if (catError || !catData) {
      return alert('Categoria não encontrada');
    }

    const { error } = await supabase.from('topicos').insert({
      titulo: newTopic,
      descricao: newDesc,
      categoria_id: catData.id,
      user_email: user?.email,
      created_at: new Date().toISOString(),
      status: canApprove(user) ? 'approved' : 'pending'
    });

    if (error) return alert(error.message);

    setNewTopic('');
    setNewDesc('');
    setNewCat('');
    setShowTopic(false);

    load();
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

  async function createCategory() {
    if (!newCategoryName?.trim()) {
      return alert('Digite uma categoria');
    }

    const { error } = await supabase
      .from('categorias')
      .insert({
        nome: newCategoryName
      });

    if (error) return alert(error.message);

    setNewCategoryName('');
    setShowCategoryModal(false);

    load();
  }

  async function deleteCategory() {
    setShowDeleteCategory(true);
  }

  async function confirmDeleteCategories() {
    if (!selectedCategories.length) {
      return alert('Selecione categorias');
    }

    const confirmar = confirm(
      `Excluir categorias:\n\n${selectedCategories.join('\n')}`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from('categorias')
      .delete()
      .in('nome', selectedCategories);

    if (error) return alert(error.message);

    setSelectedCategories([]);
    setShowDeleteCategory(false);

    load();
  }

  function toggleCategory(nome) {
    setSelectedCategories(prev =>
      prev.includes(nome)
        ? prev.filter(n => n !== nome)
        : [...prev, nome]
    );
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

  const commentTrees = useMemo(() => {
    const map = {};

    visibleTopics.forEach(topic => {
      map[topic.id] = buildTree(comments, null, topic.id);
    });

    return map;
  }, [comments, visibleTopics]);

  function formatDate(date) {
    if (!date) return '';

    return new Date(date).toLocaleString('pt-BR');
  }

  const ReplyBox = memo(function ReplyBox({
    commentId,
    topicId,
    addComment
  }) {
    const [localText, setLocalText] = useState('');

    return (
      <div
        style={{
          marginTop: 10,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap'
        }}
      >
        <input
          style={styles.input}
          placeholder="Responder comentário..."
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
        />

        <button
          style={styles.mainBtn}
          onClick={async () => {
            await addComment(topicId, commentId, localText);

            setLocalText('');
          }}
        >
          enviar
        </button>
      </div>
    );
  });

  const CommentNode = memo(function CommentNode({
    comment,
    level = 0
  }) {
    return (
      <div
        style={{
          ...styles.commentBox,
          marginLeft: level * 25
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
            onClick={() =>
              setReplyInput(prev => ({
                ...prev,
                [comment.id]: prev[comment.id] ?? true
              }))
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

        {replyInput[comment.id] && (
          <ReplyBox
            commentId={comment.id}
            topicId={comment.topic_id}
            addComment={addComment}
          />
        )}

        {comment.children?.length > 0 &&
          comment.children.map(child => (
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
        className="mobileInput"
        placeholder="Buscar tópicos e comentários..."
        value={q}
        onChange={e => setQ(e.target.value)}
        style={styles.search}
      />

      <div style={styles.topBar}>
        <button
          style={styles.mainBtn}
          onClick={() => setShowTopic(true)}
        >
          + Novo Tópico
        </button>

        <button
          style={styles.mainBtn}
          onClick={() => setShowCategoryModal(true)}
        >
          + Nova Categoria
        </button>

        <button
          style={styles.smallBtnDanger}
          onClick={deleteCategory}
        >
          Excluir Categoria
        </button>
      </div>
    </Layout>
  );
}

const styles = {
  topBar: {
    display: 'flex',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap'
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

  input: {
    flex: 1,
    background: '#0b0b0b',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    minWidth: 0
  },

  mainBtn: {
    background: '#FFD600',
    color: '#000',
    border: 'none',
    borderRadius: 12,
    padding: '12px 18px',
    cursor: 'pointer'
  },

  smallBtn: {
    background: 'transparent',
    border: '1px solid #FFD600',
    color: '#FFD600',
    padding: '6px 10px',
    cursor: 'pointer'
  },

  smallBtnDanger: {
    background: 'transparent',
    border: '1px solid #ff4d4d',
    color: '#ff4d4d',
    padding: '6px 10px',
    cursor: 'pointer'
  },

  commentBox: {
    marginTop: 16,
    padding: 12,
    borderLeft: '2px solid #FFD600',
    background: '#0d0d0d',
    borderRadius: 10
  },

  commentMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#888',
    fontSize: 11,
    gap: 10,
    flexWrap: 'wrap'
  },

  commentText: {
    marginTop: 8,
    color: '#eee',
    wordBreak: 'break-word'
  },

  commentActions: {
    display: 'flex',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap'
  }
};
