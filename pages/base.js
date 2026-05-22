import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';

export default function Base() {
  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);

  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [newCategory, setNewCategory] = useState('');
  const [newTopic, setNewTopic] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: c } = await supabase.from('categorias').select('*');
    const { data: t } = await supabase.from('topicos').select('*');
    const { data: cm } = await supabase.from('comentarios').select('*');

    setCategories(c || []);
    setTopics(t || []);
    setComments(cm || []);
  }

  /* =========================
     CATEGORIAS
  ========================== */

  async function createCategory() {
    if (!newCategory) return;

    await supabase.from('categorias').insert([{ nome: newCategory }]);
    setNewCategory('');
    loadData();
  }

  async function deleteCategory(id) {
    await supabase.from('categorias').delete().eq('id', id);
    loadData();
  }

  /* =========================
     TOPICOS
  ========================== */

  async function createTopic() {
    if (!newTopic) return;

    await supabase.from('topicos').insert([
      {
        titulo: newTopic,
        categoria_id: categories[0]?.id || null
      }
    ]);

    setNewTopic('');
    loadData();
  }

  async function deleteTopic(id) {
    await supabase.from('topicos').delete().eq('id', id);
    loadData();
  }

  /* =========================
     COMMENTS
  ========================== */

  async function createComment(topicId, text) {
    const { data } = await supabase.auth.getUser();

    await supabase.from('comentarios').insert([
      {
        topico_id: topicId,
        texto: text,
        user_id: data?.user?.id
      }
    ]);

    loadData();
  }

  /* =========================
     FILTER
  ========================== */

  const filteredTopics = topics.filter(t =>
    t.titulo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <Layout>

        <div style={styles.container}>

          <h1 style={styles.title}>Base de Conhecimento</h1>

          {/* 🔎 SEARCH */}
          <input
            style={styles.search}
            placeholder="Buscar tópicos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* 🔘 ACTIONS */}
          <div style={styles.actions}>

            <input
              placeholder="Nova categoria"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={styles.input}
            />

            <button onClick={createCategory} style={styles.btn}>
              Nova Categoria
            </button>

            <input
              placeholder="Novo tópico"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              style={styles.input}
            />

            <button onClick={createTopic} style={styles.btn}>
              Novo Tópico
            </button>

          </div>

          {/* 📁 CATEGORIAS */}
          <div style={styles.categoryRow}>
            {categories.map(c => (
              <div key={c.id} style={styles.categoryCard}>
                <span>{c.nome}</span>

                <button
                  onClick={() => deleteCategory(c.id)}
                  style={styles.delete}
                >
                  x
                </button>
              </div>
            ))}
          </div>

          {/* 📄 TOPICOS */}
          <div style={styles.list}>

            {filteredTopics.map(t => {
              const cat = categories.find(c => c.id === t.categoria_id);

              return (
                <div key={t.id} style={styles.card}>

                  <div style={styles.topRow}>
                    <h3 style={{ color: '#f5c400' }}>{t.titulo}</h3>

                    <button
                      onClick={() => deleteTopic(t.id)}
                      style={styles.delete}
                    >
                      Excluir
                    </button>
                  </div>

                  <p style={styles.category}>
                    Categoria: {cat?.nome || 'Sem categoria'}
                  </p>

                  <button
                    style={styles.commentBtn}
                    onClick={() =>
                      setSelectedTopic(selectedTopic === t.id ? null : t.id)
                    }
                  >
                    Ver comentários
                  </button>

                  {/* 💬 COMMENTS */}
                  {selectedTopic === t.id && (
                    <CommentBox
                      comments={comments}
                      topicId={t.id}
                      createComment={createComment}
                    />
                  )}

                </div>
              );
            })}

          </div>

        </div>

      </Layout>
    </ProtectedRoute>
  );
}

/* =========================
   COMPONENT COMMENTS
========================= */

function CommentBox({ comments, topicId, createComment }) {
  const [text, setText] = useState('');

  return (
    <div style={styles.comments}>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escreva um comentário..."
        style={styles.textarea}
      />

      <button
        style={styles.btn}
        onClick={() => {
          createComment(topicId, text);
          setText('');
        }}
      >
        Enviar comentário
      </button>

      {comments
        .filter(c => c.topico_id === topicId)
        .map(c => (
          <div key={c.id} style={styles.comment}>
            {c.texto}
          </div>
        ))}
    </div>
  );
}

/* =========================
   STYLES (UX PRETO + AMARELO)
========================= */

const styles = {
  container: {
    padding: 20,
    color: '#fff'
  },

  title: {
    color: '#f5c400'
  },

  search: {
    width: '100%',
    padding: 12,
    marginBottom: 15,
    background: '#111',
    border: '1px solid #333',
    color: '#fff',
    borderRadius: 8
  },

  actions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 15
  },

  input: {
    padding: 10,
    background: '#111',
    border: '1px solid #333',
    color: '#fff',
    borderRadius: 8
  },

  btn: {
    padding: 10,
    background: '#f5c400',
    border: 0,
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  categoryRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 20
  },

  categoryCard: {
    padding: 8,
    background: '#111',
    border: '1px solid #333',
    borderRadius: 8,
    display: 'flex',
    gap: 10,
    alignItems: 'center'
  },

  list: {
    display: 'grid',
    gap: 10
  },

  card: {
    padding: 15,
    background: '#111',
    borderRadius: 10,
    border: '1px solid #222'
  },

  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  category: {
    color: '#aaa',
    marginTop: 5
  },

  commentBtn: {
    marginTop: 10,
    background: '#333',
    color: '#f5c400',
    border: 0,
    padding: 8,
    borderRadius: 6,
    cursor: 'pointer'
  },

  comments: {
    marginTop: 10,
    padding: 10,
    background: '#000',
    borderRadius: 8
  },

  textarea: {
    width: '100%',
    minHeight: 80,
    padding: 10,
    background: '#111',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: 8
  },

  comment: {
    marginTop: 8,
    padding: 8,
    borderBottom: '1px solid #222'
  },

  delete: {
    background: 'red',
    color: '#fff',
    border: 0,
    padding: '4px 8px',
    borderRadius: 6,
    cursor: 'pointer'
  }
};
