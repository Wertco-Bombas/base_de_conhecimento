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
  const [showDeleteCategory, setShowDeleteCategory] = useState(false);

  const [newTopic, setNewTopic] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('all');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedToDelete, setSelectedToDelete] = useState([]);

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

    const { data: cat } = await supabase
      .from('categorias')
      .select('*')
      .order('nome');

    setTopics(t || []);
    setComments(c || []);
    setCategories(cat || []);
  }

  async function createTopic() {

    if (!newTopic || !newCat) {
      alert('Preencha tudo');
      return;
    }

    const { error } = await supabase.from('topicos').insert({
      titulo: newTopic,
      descricao: newDesc,
      categoria: newCat,
      user_email: user?.email,
      created_at: new Date().toISOString()
    });

    if (error) return alert(error.message);

    setShowTopic(false);
    setNewTopic('');
    setNewDesc('');
    setNewCat('');
    load();
  }

  async function createCategory() {

    if (!newCategoryName) return;

    const { error } = await supabase.from('categorias').insert({
      nome: newCategoryName
    });

    if (error) return alert(error.message);

    setNewCategoryName('');
    setShowCategory(false);
    load();
  }

  async function deleteSelectedCategories() {

    if (!selectedToDelete.length) return;

    const confirmDelete = confirm('Excluir categorias selecionadas?');
    if (!confirmDelete) return;

    await supabase
      .from('categorias')
      .delete()
      .in('nome', selectedToDelete);

    setSelectedToDelete([]);
    setShowDeleteCategory(false);
    load();
  }

  async function addComment(topicId, parentId = null, text = null) {

    const value = text || commentInput[topicId];
    if (!value?.trim()) return;

    await supabase.from('comentarios').insert({
      topic_id: topicId,
      parent_id: parentId,
      texto: value,
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

  const filteredTopics = topics.filter(t => {

    const byCategory =
      selectedCategory === 'all' ||
      t.categoria === selectedCategory;

    const bySearch =
      `${t.titulo} ${t.descricao}`
        .toLowerCase()
        .includes(q.toLowerCase());

    return byCategory && bySearch;
  });

  function formatDate(d) {
    return d ? new Date(d).toLocaleString('pt-BR') : '';
  }

  function CommentNode({ comment, level = 0 }) {

    return (
      <div style={{
        ...styles.commentBox,
        marginLeft: level * 20
      }}>

        <div style={styles.commentMeta}>
          <span>{comment.user_email}</span>
          <span>{formatDate(comment.created_at)}</span>
        </div>

        <div>{comment.texto}</div>

        <div style={styles.commentActions}>

          <button onClick={() => setReplyTo(comment)}>
            responder
          </button>

          <button onClick={() => deleteComment(comment.id)}>
            excluir
          </button>

        </div>

        {comment.children?.map(c => (
          <CommentNode key={c.id} comment={c} level={level + 1} />
        ))}

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

      {/* CATEGORY FILTERS */}
      <div style={styles.filters}>

        <button
          style={selectedCategory === 'all' ? styles.filterActive : styles.filter}
          onClick={() => setSelectedCategory('all')}
        >
          Todas
        </button>

        {categories.map(c => (
          <button
            key={c.id}
            style={selectedCategory === c.nome ? styles.filterActive : styles.filter}
            onClick={() => setSelectedCategory(c.nome)}
          >
            {c.nome}
          </button>
        ))}

      </div>

      {/* TOP ACTIONS */}
      <div style={styles.topBar}>

        <button onClick={() => setShowTopic(true)} style={styles.mainBtn}>
          Novo Tópico
        </button>

        <button onClick={() => setShowCategory(true)} style={styles.mainBtn}>
          Nova Categoria
        </button>

        <button onClick={() => setShowDeleteCategory(true)} style={styles.dangerBtn}>
          Excluir Categoria
        </button>

      </div>

      {/* TOPICS */}
      {filteredTopics.map(t => {

        const tree = buildTree(comments, null, t.id);

        return (
          <div key={t.id} style={styles.card}>

            <h3>{t.titulo}</h3>
            <small>{t.categoria}</small>

            <p>{t.descricao}</p>

            {tree.map(c => (
              <CommentNode key={c.id} comment={c} />
            ))}

            <input
              placeholder="Comentar..."
              value={commentInput[t.id] || ''}
              onChange={e =>
                setCommentInput(prev => ({
                  ...prev,
                  [t.id]: e.target.value
                }))
              }
              style={styles.input}
            />

            <button
              onClick={() => addComment(t.id)}
              style={styles.mainBtn}
            >
              enviar
            </button>

          </div>
        );
      })}

      {/* MODAL CATEGORY */}
      {showCategory && (
        <div style={styles.modal}>
          <div style={styles.box}>

            <h3>Nova Categoria</h3>

            <input
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              style={styles.input}
            />

            <button onClick={createCategory} style={styles.mainBtn}>
              salvar
            </button>

          </div>
        </div>
      )}

      {/* DELETE CATEGORY */}
      {showDeleteCategory && (
        <div style={styles.modal}>
          <div style={styles.box}>

            <h3>Excluir Categorias</h3>

            {categories.map(c => (
              <label key={c.id} style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  checked={selectedToDelete.includes(c.nome)}
                  onChange={() => {

                    setSelectedToDelete(prev =>
                      prev.includes(c.nome)
                        ? prev.filter(x => x !== c.nome)
                        : [...prev, c.nome]
                    );
                  }}
                />
                {c.nome}
              </label>
            ))}

            <button onClick={deleteSelectedCategories} style={styles.dangerBtn}>
              excluir selecionadas
            </button>

          </div>
        </div>
      )}

      {/* TOPIC MODAL */}
      {showTopic && (
        <div style={styles.modal}>
          <div style={styles.box}>

            <h3>Novo Tópico</h3>

            <input value={newTopic} onChange={e => setNewTopic(e.target.value)} style={styles.input} />
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)} style={styles.input} />
            <input value={newCat} onChange={e => setNewCat(e.target.value)} style={styles.input} />

            <button onClick={createTopic} style={styles.mainBtn}>
              salvar
            </button>

          </div>
        </div>
      )}

    </Layout>
  );
}

/* STYLE */

const styles = {

  search: { width: '100%', padding: 10, marginBottom: 10 },

  topBar: { display: 'flex', gap: 10, marginBottom: 10 },

  filters: { display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' },

  filter: {
    padding: 6,
    border: '1px solid #444',
    background: '#111',
    color: '#fff'
  },

  filterActive: {
    padding: 6,
    border: '1px solid yellow',
    background: 'yellow',
    color: '#000'
  },

  card: {
    background: '#111',
    padding: 15,
    marginBottom: 10,
    color: '#fff'
  },

  mainBtn: {
    padding: 10,
    background: 'yellow',
    border: 'none',
    cursor: 'pointer'
  },

  dangerBtn: {
    padding: 10,
    background: '#ff4d4d',
    border: 'none',
    color: '#fff'
  },

  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  box: {
    background: '#111',
    padding: 20,
    width: 400,
    color: '#fff'
  },

  input: {
    width: '100%',
    marginBottom: 10,
    padding: 10
  }
};
