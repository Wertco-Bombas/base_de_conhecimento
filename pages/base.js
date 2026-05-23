import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [topics, setTopics] = useState([]);
  const [commentsByTopic, setCommentsByTopic] = useState({});

  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  const [newTopic, setNewTopic] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    loadTopics();
  }, []);

  async function loadTopics() {
    console.log('🔄 carregando dados...');

    const { data: topicsData, error: topicsError } = await supabase
      .from('topicos')
      .select('*')
      .order('id', { ascending: false });

    const { data: commentsData, error: commentsError } = await supabase
      .from('comentarios')
      .select('*');

    console.log('📌 TOPICOS:', topicsData, topicsError);
    console.log('💬 COMMENTS:', commentsData, commentsError);

    const grouped = {};

    (commentsData || []).forEach(c => {
      const key = c.topic_id || c.topico_id;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(c);
    });

    setTopics(topicsData || []);
    setCommentsByTopic(grouped);
  }

  async function createTopic() {
    if (!newTopic) return;

    const { error } = await supabase.from('topicos').insert({
      titulo: newTopic,
      categoria: newCategory,
      status: 'approved'
    });

    console.log('CREATE TOPIC ERROR:', error);

    if (!error) {
      setNewTopic('');
      setNewCategory('');
      loadTopics();
    }
  }

  async function deleteTopic(id) {
    const { error } = await supabase
      .from('topicos')
      .delete()
      .eq('id', id);

    console.log('DELETE ERROR:', error);

    if (!error) {
      loadTopics();
    }
  }

  async function addComment(topicId, text) {
    console.log('🟡 CLICK ADD COMMENT:', { topicId, text });

    if (!text || !text.trim()) {
      console.log('❌ texto vazio');
      return;
    }

    const { data, error } = await supabase.from('comentarios').insert({
      topic_id: topicId,
      texto: text,
      status: 'approved'
    });

    console.log('🟢 INSERT DATA:', data);
    console.log('🔴 INSERT ERROR:', error);

    if (error) {
      alert('Erro ao salvar comentário: ' + error.message);
      return;
    }

    await loadTopics();
  }

  const filtered = topics
    .filter(t =>
      (t.titulo || '').toLowerCase().includes(q.toLowerCase())
    )
    .filter(t =>
      category ? t.categoria === category : true
    );

  return (
    <Layout>

      <h1>Base de Conhecimento</h1>

      {/* CREATE TOPIC */}
      <div style={styles.box}>
        <input
          placeholder="Novo tópico"
          value={newTopic}
          onChange={e => setNewTopic(e.target.value)}
        />

        <input
          placeholder="Categoria"
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
        />

        <button onClick={createTopic}>Criar</button>
      </div>

      {/* SEARCH + FILTER */}
      <div style={styles.box}>
        <input
          placeholder="Buscar..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />

        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="">Todas categorias</option>
          {[...new Set(topics.map(t => t.categoria))].map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* LIST */}
      {filtered.map(topic => (
        <div key={topic.id} style={styles.card}>

          <h3>{topic.titulo}</h3>
          <p>{topic.categoria}</p>

          <button onClick={() => deleteTopic(topic.id)}>
            Excluir
          </button>

          {/* COMMENTS LIST */}
          <div style={{ marginTop: 10 }}>
            {(commentsByTopic[topic.id] || []).map(c => (
              <div key={c.id} style={{ color: '#aaa', fontSize: 12 }}>
                💬 {c.texto}
              </div>
            ))}
          </div>

          {/* ADD COMMENT */}
          <div style={{ marginTop: 10 }}>

            <input
              placeholder="Comentar..."
              value={commentInputs[topic.id] || ''}
              onChange={e =>
                setCommentInputs(prev => ({
                  ...prev,
                  [topic.id]: e.target.value
                }))
              }
            />

            <button
              onClick={() => {
                console.log('🔵 BOTÃO CLICADO');
                addComment(topic.id, commentInputs[topic.id]);
              }}
            >
              Enviar
            </button>

          </div>

        </div>
      ))}

    </Layout>
  );
}

const styles = {
  box: {
    marginBottom: 15,
    display: 'flex',
    gap: 10
  },
  card: {
    background: '#111',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8
  }
};
