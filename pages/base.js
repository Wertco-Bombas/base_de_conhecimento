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

  const [editComment, setEditComment] = useState(null);
  const [editText, setEditText] = useState('');

  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [newTopic, setNewTopic] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user);
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

  async function createTopic() {
    await supabase.from('topicos').insert({
      titulo: newTopic,
      descricao: newDesc,
      categoria: newCat,
      user_email: user?.email,
      created_at: new Date()
    });

    setShowTopicModal(false);
    load();
  }

  async function addComment(topicId, parentId = null) {
    const text = commentInput[topicId];

    await supabase.from('comentarios').insert({
      topic_id: topicId,
      parent_id: parentId,
      texto: text,
      user_email: user?.email,
      created_at: new Date()
    });

    setCommentInput(prev => ({ ...prev, [topicId]: '' }));
    load();
  }

  async function deleteComment(id) {
    await supabase.from('comentarios').delete().eq('id', id);
    load();
  }

  async function updateComment(id) {
    await supabase
      .from('comentarios')
      .update({ texto: editText })
      .eq('id', id);

    setEditComment(null);
    load();
  }

  const filteredTopics = topics.filter(t =>
    (t.titulo + t.descricao).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Layout>

      {/* SEARCH */}
      <input
        placeholder="Buscar tudo..."
        value={q}
        onChange={e => setQ(e.target.value)}
        style={styles.search}
      />

      {/* ACTIONS */}
      <div style={styles.actions}>
        <button onClick={() => setShowCategoryModal(true)}>Nova Categoria</button>
        <button onClick={() => setShowTopicModal(true)}>Novo Tópico</button>
      </div>

      {/* TOPICS */}
      {filteredTopics.map(t => (
        <div key={t.id} style={styles.card}>

          <h3>{t.titulo}</h3>
          <p>{t.descricao}</p>
          <small>{t.categoria}</small>

          {/* COMMENTS */}
          {comments
            .filter(c => c.topic_id === t.id && !c.parent_id)
            .map(c => (
              <div key={c.id} style={styles.comment}>

                {editComment === c.id ? (
                  <>
                    <input value={editText} onChange={e => setEditText(e.target.value)} />
                    <button onClick={() => updateComment(c.id)}>salvar</button>
                  </>
                ) : (
                  <>
                    <span>{c.texto}</span>

                    <button onClick={() => {
                      setEditComment(c.id);
                      setEditText(c.texto);
                    }}>editar</button>

                    <button onClick={() => deleteComment(c.id)}>excluir</button>

                    <button onClick={() => setReplyTo(c.id)}>responder</button>
                  </>
                )}

                {/* REPLIES */}
                {comments
                  .filter(r => r.parent_id === c.id)
                  .map(r => (
                    <div key={r.id} style={styles.reply}>
                      ↳ {r.texto}
                    </div>
                  ))}

              </div>
            ))}

          {/* INPUT COMMENT */}
          <div style={styles.row}>
            <input
              placeholder={replyTo ? "Responder..." : "Comentar..."}
              value={commentInput[t.id] || ''}
              onChange={e =>
                setCommentInput(prev => ({
                  ...prev,
                  [t.id]: e.target.value
                }))
              }
            />

            <button onClick={() => addComment(t.id, replyTo)}>
              enviar
            </button>
          </div>

        </div>
      ))}

    </Layout>
  );
}

const styles = {
  search: { width: '100%', padding: 10, marginBottom: 20 },

  actions: { display: 'flex', gap: 10, marginBottom: 20 },

  card: { background: '#111', padding: 15, marginBottom: 10 },

  comment: { marginTop: 10, color: '#aaa' },

  reply: { marginLeft: 20, color: '#888', fontSize: 12 },

  row: { display: 'flex', gap: 10, marginTop: 10 }
};
