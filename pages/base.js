import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [topics, setTopics] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  const [newTopic, setNewTopic] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const [comment, setComment] = useState('');

  useEffect(() => {
    loadTopics();
  }, []);

  async function loadTopics() {
    const { data } = await supabase
      .from('topicos')
      .select('*')
      .order('created_at', { ascending: false });

    setTopics(data || []);
  }

  async function createTopic() {
    await supabase.from('topicos').insert({
      titulo: newTopic,
      categoria: newCategory,
      status: 'approved'
    });

    setNewTopic('');
    setNewCategory('');
    loadTopics();
  }

  async function deleteTopic(id) {
    await supabase
      .from('topicos')
      .delete()
      .eq('id', id);

    loadTopics();
  }

  async function addComment(topicId) {
    await supabase.from('comentarios').insert({
      topic_id: topicId,
      texto: comment,
      status: 'approved'
    });

    setComment('');
  }

  const filtered = topics
    .filter(t =>
      t.titulo.toLowerCase().includes(q.toLowerCase())
    )
    .filter(t =>
      category ? t.categoria === category : true
    );

  return (
    <Layout>

      <h1>Base de Conhecimento</h1>

      {/* CREATE */}
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
          {[...new Set(topics.map(t => t.categoria))].map(c => (
            <option key={c} value={c}>{c}</option>
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

          {/* COMMENTS */}
          <div style={{ marginTop: 10 }}>
            <input
              placeholder="Comentar..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />

            <button onClick={() => addComment(topic.id)}>
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
