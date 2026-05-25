import { useEffect, useState, useMemo, memo, useCallback } from 'react';
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

  async function createTopic() {
    if (!user) return alert('Faça login');
    if (!newTopic || !newCat) return alert('Preencha título e categoria');

    const { data: catData, error: catError } = await supabase
      .from('categorias')
      .select('id')
      .eq('nome', newCat)
      .single();

    if (catError || !catData) return alert('Categoria não encontrada');

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
    const nome = prompt('Nome da categoria');
    if (!nome) return;

    const { error } = await supabase.from('categorias').insert({ nome });

    if (error) return alert(error.message);

    alert('Categoria criada');
  }

  async function deleteCategory() {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome');

    if (error) return alert(error.message);
    if (!data?.length) return alert('Nenhuma categoria cadastrada');

    const lista = data.map((c, i) => `${i + 1} - ${c.nome}`).join('\n');

    const resposta = prompt(
      `Categorias disponíveis:\n\n${lista}\n\nDigite os números separados por vírgula.`
    );

    if (!resposta) return;

    const indexes = resposta
      .split(',')
      .map(v => parseInt(v.trim()) - 1)
      .filter(v => v >= 0);

    const categoriasSelecionadas = indexes
      .map(i => data[i]?.nome)
      .filter(Boolean);

    if (!categoriasSelecionadas.length) {
      return alert('Nenhuma categoria válida selecionada');
    }

    const confirmar = confirm(
      `Excluir categorias:\n\n${categoriasSelecionadas.join('\n')} ?`
    );

    if (!confirmar) return;

    const { error: deleteError } = await supabase
      .from('categorias')
      .delete()
      .in('nome', categoriasSelecionadas);

    if (deleteError) return alert(deleteError.message);

    alert('Categorias excluídas com sucesso');
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

  /* =========================
     FIX: evita re-render pesado no input
  ========================= */
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

  /* =========================
     COMPONENTE ISOLADO (FIX DIGITAÇÃO)
  ========================= */
  const ReplyInput = memo(function ReplyInput({
    commentId,
    topicId
  }) {
    return (
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <input
          style={styles.input}
          placeholder="Responder comentário..."
          value={replyInput[commentId] || ''}
          onChange={(e) => setReplyValue(commentId, e.target.value)}
        />

        <button
          style={styles.mainBtn}
          onClick={() => {
            addComment(topicId, commentId, replyInput[commentId]);

            setReplyInput(prev => ({
              ...prev,
              [commentId]: ''
            }));
          }}
        >
          enviar
        </button>
      </div>
    );
  });

  const CommentNode = memo(function CommentNode({ comment, level = 0 }) {
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
            onClick={() =>
              setReplyInput(prev => ({
                ...prev,
                [comment.id]: prev[comment.id] ?? ''
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

        {replyInput[comment.id] !== undefined && (
          <ReplyInput
            commentId={comment.id}
            topicId={comment.topic_id}
          />
        )}

        {comment.children?.length > 0 &&
          comment.children.map(child => (
            <CommentNode key={child.id} comment={child} level={level + 1} />
          ))}
      </div>
    );
  });

  return (
    <Layout>
      <input
        placeholder="Buscar tópicos e comentários..."
        value={q}
        onChange={e => setQ(e.target.value)}
        style={styles.search}
      />

      <div style={styles.topBar}>
        <button style={styles.mainBtn} onClick={() => setShowTopic(true)}>
          + Novo Tópico
        </button>

        <button style={styles.mainBtn} onClick={createCategory}>
          + Nova Categoria
        </button>

        <button style={styles.smallBtnDanger} onClick={deleteCategory}>
          Excluir Categoria
        </button>
      </div>

      {visibleTopics.map(topic => {
        const tree = buildTree(comments, null, topic.id);

        return (
          <div key={topic.id} style={styles.card}>
            <h2>{topic.titulo}</h2>

            <div style={{ marginTop: 20 }}>
              {tree.map(comment => (
                <CommentNode key={comment.id} comment={comment} />
              ))}
            </div>

            <div style={styles.row}>
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
          </div>
        );
      })}
    </Layout>
  );
}

const styles = {
  topBar: { display: 'flex', gap: 10 },
  search: { padding: 12, width: '100%' },
  card: { padding: 20, border: '1px solid #333', marginBottom: 20 },
  input: { padding: 10, width: '100%' },
  row: { display: 'flex', gap: 10 },
  mainBtn: { padding: 10 },
  smallBtn: { marginRight: 8 },
  smallBtnDanger: { color: 'red' },
  commentBox: { marginTop: 16 },
  commentMeta: { fontSize: 12 },
  commentText: { marginTop: 5 },
  commentActions: { display: 'flex', gap: 8 }
};
