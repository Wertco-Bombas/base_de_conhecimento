import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {

  const [user, setUser] = useState(null);

  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);
  const [categories, setCategories] = useState([]);

  const [q, setQ] = useState('');

  const [commentInput, setCommentInput] = useState({});
  const [replyTo, setReplyTo] = useState(null);

  const [showTopic, setShowTopic] = useState(false);
  const [showCategory, setShowCategory] = useState(false);

  const [newTopic, setNewTopic] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });

    load();
  }, []);

  async function load() {

    const { data: t } = await supabase.from('topicos').select('*');
    const { data: c } = await supabase.from('comentarios').select('*');
    const { data: cat } = await supabase.from('categorias').select('*');

    setTopics(t || []);
    setComments(c || []);
    setCategories(cat || []);
  }

  // ---------------- TOPIC ----------------
  async function createTopic() {

    if (!selectedCategory) {
      alert("Selecione uma categoria");
      return;
    }

    const { error } = await supabase.from('topicos').insert({
      titulo: newTopic,
      descricao: newDesc,
      categoria_id: Number(selectedCategory),
      user_email: user?.email,
      created_at: new Date().toISOString()
    });

    if (error) {
      alert(error.message);
      return;
    }

    setShowTopic(false);
    setNewTopic('');
    setNewDesc('');
    setSelectedCategory('');
    load();
  }

  // ---------------- CATEGORY ----------------
  async function createCategory() {

    if (!newCategory) return;

    await supabase.from('categorias').insert({
      nome: newCategory
    });

    setNewCategory('');
    setShowCategory(false);
    load();
  }

  // ---------------- COMMENTS ----------------
  async function addComment(topicId) {

    const text = commentInput[topicId];
    if (!text?.trim()) return;

    await supabase.from('comentarios').insert({
      topic_id: topicId,
      parent_id: replyTo?.id || null,
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

  // ---------------- HELPERS ----------------
  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('pt-BR') : '';

  function buildTree(list, parentId = null, topicId = null) {
    return list
      .filter(c => c.parent_id === parentId && c.topic_id === topicId)
      .map(c => ({
        ...c,
        children: buildTree(list, c.id, topicId)
      }));
  }

  function CommentNode({ comment }) {
    return (
      <div style={styles.commentBox}>

        <div style={styles.meta}>
          <span>{comment.user_email}</span>
          <span>{formatDate(comment.created_at)}</span>
        </div>

        <div>{comment.texto}</div>

        <div style={styles.actions}>
          <button onClick={() => setReplyTo(comment)}>responder</button>
          <button onClick={() => deleteComment(comment.id)}>excluir</button>
        </div>

        {comment.children?.map(c => (
          <CommentNode key={c.id} comment={c} />
        ))}
      </div>
    );
  }

  const filteredTopics = topics.filter(t =>
    (t.titulo + t.descricao)
      .toLowerCase()
      .includes(q.toLowerCase())
  );

  return (
    <Layout>

      {/* SEARCH */}
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Buscar..."
        style={styles.search}
      />

      {/* ACTIONS */}
      <div style={styles.actionsBar}>
        <button onClick={() => setShowCategory(true)}>+ Categoria</button>
        <button onClick={() => setShowTopic(true)}>+ Tópico</button>
      </div>

      {/* TOPICS */}
      {filteredTopics.map(t => {

        const cat = categories.find(c => c.id === t.categoria_id);
        const tree = buildTree(comments, null, t.id);

        return (
          <div key={t.id} style={styles.card}>

            <div style={styles.header}>
              <div>
                <h3>{t.titulo}</h3>
                <small>Categoria: {cat?.nome || 'Sem categoria'}</small>
              </div>

              <button onClick={() => deleteTopic(t.id)}>excluir</button>
            </div>

            <p>{t.descricao}</p>

            <div style={styles.meta}>
              {t.user_email} • {formatDate(t.created_at)}
            </div>

            {tree.map(c => (
              <CommentNode key={c.id} comment={c} />
            ))}

            <div style={styles.row}>
              <input
                value={commentInput[t.id] || ''}
                onChange={e =>
                  setCommentInput(prev => ({
                    ...prev,
                    [t.id]: e.target.value
                  }))
                }
                placeholder={
                  replyTo ? "Respondendo..." : "Comentar..."
                }
              />

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
          <div style={styles.box}>

            <h3>Novo Tópico</h3>

            <input placeholder="Título" value={newTopic} onChange={e => setNewTopic(e.target.value)} />
            <input placeholder="Descrição" value={newDesc} onChange={e => setNewDesc(e.target.value)} />

            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="">Categoria</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>

            <button onClick={createTopic}>Salvar</button>
            <button onClick={() => setShowTopic(false)}>Fechar</button>

          </div>
        </div>
      )}

      {/* MODAL CATEGORY */}
      {showCategory && (
        <div style={styles.modal}>
          <div style={styles.box}>

            <h3>Nova Categoria</h3>

            <input value={newCategory} onChange={e => setNewCategory(e.target.value)} />

            <button onClick={createCategory}>Salvar</button>
            <button onClick={() => setShowCategory(false)}>Fechar</button>

          </div>
        </div>
      )}

    </Layout>
  );
}

/* ---------------- STYLE ---------------- */

const styles = {

  search: { width: '100%', padding: 10, marginBottom: 10 },

  actionsBar: { display: 'flex', gap: 10, marginBottom: 10 },

  card: { background: '#111', padding: 15, marginBottom: 10, color: '#fff' },

  header: { display: 'flex', justifyContent: 'space-between' },

  row: { display: 'flex', gap: 10, marginTop: 10 },

  commentBox: { marginLeft: 15, marginTop: 10 },

  meta: { fontSize: 12, color: '#aaa' },

  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  box: {
    background: '#222',
    padding: 20,
    width: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  }
};
