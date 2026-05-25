import { useEffect, useState, useMemo } from 'react';
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
    const { data: t, error: tError } = await supabase
      .from('topicos')
      .select('*');

    const { data: cats } = await supabase
      .from('categorias')
      .select('*');

    const tFinal = (t || []).map(topic => ({
      ...topic,
      categorias: cats?.find(c => c.id === topic.categoria_id) || null
    }));

    const { data: c, error: cError } = await supabase
      .from('comentarios')
      .select('*');

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
        children: buildTree(list, c.id, topicId)
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

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleString('pt-BR');
  }

  function CommentNode({ comment, level = 0 }) {
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
                [comment.id]: ''
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
            <div style={styles.header}>
              <div>
                <h2 style={styles.title}>{topic.titulo}</h2>
                <div style={styles.category}>{topic.categorias?.nome}</div>
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

            <div style={{ marginTop: 20 }}>
              {tree.map(comment => (
                <CommentNode key={comment.id} comment={comment} />
              ))}
            </div>

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

      {showTopic && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h2 style={{ color: '#FFD600' }}>Novo Tópico</h2>

            <input
              style={styles.input}
              placeholder="Título"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
            />

            <textarea
              style={styles.input}
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
    marginBottom: 20,
    fontSize: 15,
    outline: 'none'
  },
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    color: '#fff',
    boxShadow: '0 0 20px rgba(0,0,0,0.4)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: { margin: 0, fontSize: 24 },
  category: {
    display: 'inline-block',
    marginTop: 8,
    background: '#FFD600',
    color: '#000',
    padding: '5px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 'bold'
  },
  desc: { color: '#bbb', marginTop: 16, lineHeight: 1.6 },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 16,
    color: '#777',
    fontSize: 12
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
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    outline: 'none'
  },
  mainBtn: {
    background: '#FFD600',
    color: '#000',
    border: 'none',
    borderRadius: 12,
    padding: '12px 18px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  smallBtn: {
    background: 'transparent',
    border: '1px solid #FFD600',
    color: '#FFD600',
    padding: '6px 10px',
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
    fontSize: 11
  },
  commentText: {
    marginTop: 8,
    color: '#eee',
    lineHeight: 1.5
  },
  commentActions: {
    display: 'flex',
    gap: 8,
    marginTop: 10
  },
  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999
  },
  modalBox: {
    width: 450,
    background: '#111',
    border: '1px solid #FFD600',
    borderRadius: 18,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 14
  }
};
