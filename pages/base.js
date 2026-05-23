import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [user, setUser] = useState(null);

  const [topics, setTopics] = useState([]);
  const [commentsByTopic, setCommentsByTopic] = useState({});
  const [categories, setCategories] = useState([]);

  const [q, setQ] = useState('');

  // TOPIC
  const [openTopicModal, setOpenTopicModal] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // COMMENT
  const [commentInputs, setCommentInputs] = useState({});
  const [replyTo, setReplyTo] = useState({}); // topicId -> parentId

  // EDIT
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });

    load();
  }, []);

  async function load() {
    const { data: topicsData } = await supabase
      .from('topicos')
      .select('*')
      .order('id', { ascending: false });

    const { data: commentsData } = await supabase
      .from('comentarios')
      .select('*');

    const grouped = {};

    (commentsData || []).forEach(c => {
      if (!grouped[c.topic_id]) grouped[c.topic_id] = [];
      grouped[c.topic_id].push(c);
    });

    setTopics(topicsData || []);
    setCommentsByTopic(grouped);

    const cats = [...new Set((topicsData || []).map(t => t.categoria))];
    setCategories(cats);
  }

  // ---------------- TOPIC ----------------
  async function createTopic() {
    if (!newTopic || !selectedCategory) return;

    await supabase.from('topicos').insert({
      titulo: newTopic,
      descricao: newDescription,
      categoria: selectedCategory
    });

    setNewTopic('');
    setNewDescription('');
    setSelectedCategory('');
    setOpenTopicModal(false);

    load();
  }

  async function deleteTopic(id) {
    await supabase.from('topicos').delete().eq('id', id);
    load();
  }

  // ---------------- COMMENT ----------------
  async function addComment(topicId) {
    const text = commentInputs[topicId];
    const parent = replyTo[topicId] || null;

    if (!text || !text.trim()) return;

    await supabase.from('comentarios').insert({
      topic_id: topicId,
      parent_id: parent,
      texto: text,
      user_id: user?.id
    });

    setCommentInputs(prev => ({ ...prev, [topicId]: '' }));
    setReplyTo(prev => ({ ...prev, [topicId]: null }));

    load();
  }

  async function deleteComment(id) {
    await supabase.from('comentarios').delete().eq('id', id);
    load();
  }

  function startEdit(c) {
    setEditingId(c.id);
    setEditingText(c.texto);
  }

  async function saveEdit(id) {
    await supabase
      .from('comentarios')
      .update({ texto: editingText })
      .eq('id', id);

    setEditingId(null);
    setEditingText('');
    load();
  }

  const renderComments = (topicId, parentId = null, level = 0) => {
    return (commentsByTopic[topicId] || [])
      .filter(c => (c.parent_id || null) === parentId)
      .map(c => (
        <div key={c.id} style={{ marginLeft: level * 20, marginTop: 8 }}>

          {editingId === c.id ? (
            <>
              <input
                value={editingText}
                onChange={e => setEditingText(e.target.value)}
              />
              <button onClick={() => saveEdit(c.id)}>Salvar</button>
            </>
          ) : (
            <>
              <div style={{ color: '#aaa' }}>
                💬 {c.texto}
              </div>

              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => startEdit(c)}>✏️</button>
                <button onClick={() => deleteComment(c.id)}>🗑</button>

                <button
                  onClick={() =>
                    setReplyTo(prev => ({
                      ...prev,
                      [topicId]: c.id
                    }))
                  }
                >
                  responder
                </button>
              </div>

              {renderComments(topicId, c.id, level + 1)}
            </>
          )}

        </div>
      ));
  };

  const filtered = topics.filter(t =>
    (t.titulo || '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Layout>

      <h1>Base de Conhecimento</h1>

      {/* SEARCH */}
      <input
        placeholder="Buscar..."
        value={q}
        onChange={e => setQ(e.target.value)}
      />

      {/* TOPICS */}
      {filtered.map(topic => (
        <div key={topic.id} style={styles.card}>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>{topic.titulo}</h3>
            <button onClick={() => deleteTopic(topic.id)}>Excluir</button>
          </div>

          <p>{topic.descricao}</p>
          <p style={{ color: '#f5c400' }}>{topic.categoria}</p>

          {/* COMMENTS TREE */}
          {renderComments(topic.id)}

          {/* INPUT */}
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <input
              placeholder={
                replyTo[topic.id]
                  ? 'Respondendo comentário...'
                  : 'Comentar no tópico...'
              }
              value={commentInputs[topic.id] || ''}
              onChange={e =>
                setCommentInputs(prev => ({
                  ...prev,
                  [topic.id]: e.target.value
                }))
              }
            />

            {replyTo[topic.id] && (
              <button
                onClick={() =>
                  setReplyTo(prev => ({ ...prev, [topic.id]: null }))
                }
              >
                cancelar resposta
              </button>
            )}

            <button onClick={() => addComment(topic.id)}>
              enviar
            </button>
          </div>

        </div>
      ))}

      {/* MODAL TOPIC */}
      {openTopicModal && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>

            <h3>Novo Tópico</h3>

            <input
              placeholder="Título"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
            />

            <textarea
              placeholder="Descrição"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
            />

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">Categoria</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>

            <button onClick={createTopic}>Criar</button>
            <button onClick={() => setOpenTopicModal(false)}>Fechar</button>

          </div>
        </div>
      )}

    </Layout>
  );
}

const styles = {
  card: {
    background: '#111',
    padding: 15,
    marginTop: 10,
    borderRadius: 10
  },

  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  modalBox: {
    background: '#111',
    padding: 20,
    borderRadius: 10,
    width: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  }
};
