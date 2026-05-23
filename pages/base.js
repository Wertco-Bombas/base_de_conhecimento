import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [user, setUser] = useState(null);

  const [topics, setTopics] = useState([]);
  const [commentsByTopic, setCommentsByTopic] = useState([]);
  const [categories, setCategories] = useState([]);

  const [showTopicModal, setShowTopicModal] = useState(false);

  const [newTopic, setNewTopic] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

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

  async function createTopic() {
    await supabase.from('topicos').insert({
      titulo: newTopic,
      descricao: newDescription,
      categoria: selectedCategory,
      user_email: user?.email,
      created_at: new Date()
    });

    setShowTopicModal(false);
    setNewTopic('');
    setNewDescription('');
    setSelectedCategory('');
    load();
  }

  async function deleteTopic(id) {
    await supabase.from('topicos').delete().eq('id', id);
    load();
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div style={styles.page}>

      {/* TOP BAR */}
      <div style={styles.topbar}>
        <div style={styles.brand}>WERTCO</div>

        <div style={styles.userBox}>
          <span style={{ color: '#aaa', fontSize: 12 }}>
            {user?.email || 'não logado'}
          </span>

          <button onClick={logout} style={styles.logout}>
            Sair
          </button>
        </div>
      </div>

      <div style={styles.container}>

        {/* HEADER ACTIONS */}
        <div style={styles.header}>
          <h2>Base de Conhecimento</h2>

          <button
            style={styles.primaryBtn}
            onClick={() => setShowTopicModal(true)}
          >
            + Novo Tópico
          </button>
        </div>

        {/* TOPICS */}
        {topics.map(topic => (
          <div key={topic.id} style={styles.card}>

            <div style={styles.cardHeader}>
              <h3>{topic.titulo}</h3>

              <button
                style={styles.dangerBtn}
                onClick={() => deleteTopic(topic.id)}
              >
                Excluir
              </button>
            </div>

            <p style={{ color: '#ccc' }}>{topic.descricao}</p>

            <span style={styles.tag}>
              {topic.categoria}
            </span>

          </div>
        ))}

      </div>

      {/* MODAL */}
      {showTopicModal && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>

            <h3>Novo Tópico</h3>

            <input
              placeholder="Título"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
              style={styles.input}
            />

            <textarea
              placeholder="Descrição"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              style={styles.input}
            />

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={styles.input}
            >
              <option value="">Categoria</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>

            <button onClick={createTopic} style={styles.primaryBtn}>
              Criar
            </button>

            <button onClick={() => setShowTopicModal(false)}>
              Cancelar
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  page: {
    background: '#0b0b0b',
    minHeight: '100vh',
    color: '#fff'
  },

  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px 20px',
    borderBottom: '1px solid #222'
  },

  brand: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#f5c400'
  },

  userBox: {
    display: 'flex',
    gap: 10,
    alignItems: 'center'
  },

  logout: {
    background: '#222',
    color: '#fff',
    border: '1px solid #333',
    padding: '5px 10px',
    borderRadius: 6,
    cursor: 'pointer'
  },

  container: {
    padding: 20
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 20
  },

  primaryBtn: {
    background: '#f5c400',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  dangerBtn: {
    background: '#2a2a2a',
    color: '#ff4d4d',
    border: '1px solid #333',
    padding: '5px 8px',
    borderRadius: 6
  },

  card: {
    background: '#111',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  tag: {
    display: 'inline-block',
    marginTop: 10,
    fontSize: 12,
    color: '#f5c400'
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
  },

  input: {
    padding: 10,
    background: '#000',
    border: '1px solid #333',
    color: '#fff',
    borderRadius: 6
  }
};
