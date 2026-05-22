import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';
import { uploadImage } from '../lib/uploadImage';
import { log } from '../lib/audit';

export default function Base() {
  const [user, setUser] = useState(null);

  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);

  const [selectedTopic, setSelectedTopic] = useState(null);

  const [search, setSearch] = useState('');

  // modais simples
  const [editingTopic, setEditingTopic] = useState(null);
  const [editingComment, setEditingComment] = useState(null);

  // forms
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const u = await supabase.auth.getUser();
    setUser(u.data?.user);
    load();
  }

  async function load() {
    const { data: c } = await supabase.from('categorias').select('*');
    const { data: t } = await supabase.from('topicos').select('*');
    const { data: cm } = await supabase.from('comentarios').select('*');

    setCategories(c || []);
    setTopics(t || []);
    setComments(cm || []);
  }

  /* =========================
     TOPIC EDIT
  ========================== */

  async function updateTopic(id, title, desc) {
    await supabase
      .from('topicos')
      .update({
        titulo: title,
        descricao: desc,
        updated_at: new Date()
      })
      .eq('id', id);

    await log('UPDATE_TOPIC', user, 'topicos', id);

    setEditingTopic(null);
    load();
  }

  /* =========================
     COMMENT CREATE (COM IMAGEM)
  ========================== */

  async function createComment(topicId) {
    if (!commentText && !commentImage) return;

    let imageUrl = null;

    if (commentImage) {
      imageUrl = await uploadImage(commentImage);
    }

    await supabase.from('comentarios').insert([
      {
        topico_id: topicId,
        texto: commentText,
        image_url: imageUrl,
        user_id: user?.id
      }
    ]);

    await log('CREATE_COMMENT', user, 'comentarios', topicId);

    setCommentText('');
    setCommentImage(null);

    load();
  }

  /* =========================
     COMMENT EDIT
  ========================== */

  async function updateComment(id, text) {
    await supabase
      .from('comentarios')
      .update({
        texto: text,
        updated_at: new Date()
      })
      .eq('id', id);

    await log('UPDATE_COMMENT', user, 'comentarios', id);

    setEditingComment(null);
    load();
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

          {/* SEARCH */}
          <input
            style={styles.search}
            placeholder="Buscar tópicos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* TOPICS */}
          <div style={styles.list}>

            {filteredTopics.map(t => {

              const cat = categories.find(c => c.id === t.categoria_id);

              return (
                <div key={t.id} style={styles.card}>

                  <h3 style={{ color: '#f5c400' }}>{t.titulo}</h3>

                  <p>{t.descricao}</p>

                  <p style={{ color: '#888' }}>
                    Categoria: {cat?.nome || 'Sem categoria'}
                  </p>

                  <p style={{ fontSize: 12, color: '#666' }}>
                    Atualizado: {t.updated_at ? new Date(t.updated_at).toLocaleString() : '—'}
                  </p>

                  <button
                    style={styles.btnSmall}
                    onClick={() =>
                      setEditingTopic(editingTopic === t.id ? null : t.id)
                    }
                  >
                    Editar
                  </button>

                  {/* EDIT TOPIC */}
                  {editingTopic === t.id && (
                    <TopicEditor topic={t} onSave={updateTopic} />
                  )}

                  <button
                    style={styles.commentBtn}
                    onClick={() =>
                      setSelectedTopic(selectedTopic === t.id ? null : t.id)
                    }
                  >
                    Comentários
                  </button>

                  {/* COMMENTS */}
                  {selectedTopic === t.id && (
                    <div style={styles.comments}>

                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        style={styles.textarea}
                        placeholder="Escreva comentário..."
                      />

                      <input
                        type="file"
                        onChange={(e) => setCommentImage(e.target.files[0])}
                      />

                      <button
                        onClick={() => createComment(t.id)}
                        style={styles.btn}
                      >
                        Enviar comentário
                      </button>

                      {comments
                        .filter(c => c.topico_id === t.id)
                        .map(c => (
                          <div key={c.id} style={styles.comment}>

                            {editingComment === c.id ? (
                              <CommentEditor
                                comment={c}
                                onSave={updateComment}
                              />
                            ) : (
                              <>
                                <p>{c.texto}</p>

                                {c.image_url && (
                                  <img
                                    src={c.image_url}
                                    style={{ width: 200, borderRadius: 8 }}
                                  />
                                )}

                                <button
                                  style={styles.btnSmall}
                                  onClick={() => setEditingComment(c.id)}
                                >
                                  Editar
                                </button>
                              </>
                            )}

                          </div>
                        ))}

                    </div>
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
   EDIT COMPONENTS
========================= */

function TopicEditor({ topic, onSave }) {
  const [title, setTitle] = useState(topic.titulo);
  const [desc, setDesc] = useState(topic.descricao);

  return (
    <div style={styles.editor}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} />

      <button onClick={() => onSave(topic.id, title, desc)}>
        Salvar
      </button>
    </div>
  );
}

function CommentEditor({ comment, onSave }) {
  const [text, setText] = useState(comment.texto);

  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={() => onSave(comment.id, text)}>
        Salvar
      </button>
    </div>
  );
}

/* =========================
   STYLES
========================= */

const styles = {
  container: { padding: 20, color: '#fff' },

  title: { color: '#f5c400' },

  search: {
    width: '100%',
    padding: 10,
    marginBottom: 15,
    background: '#111',
    border: '1px solid #333',
    color: '#fff'
  },

  list: { display: 'grid', gap: 10 },

  card: {
    padding: 15,
    background: '#111',
    borderRadius: 10
  },

  btn: {
    marginTop: 10,
    background: '#f5c400',
    border: 0,
    padding: 10,
    borderRadius: 8
  },

  btnSmall: {
    marginTop: 5,
    background: '#333',
    color: '#f5c400',
    border: 0,
    padding: 6,
    borderRadius: 6,
    cursor: 'pointer'
  },

  commentBtn: {
    marginTop: 10,
    background: '#222',
    color: '#f5c400',
    border: 0,
    padding: 8,
    borderRadius: 6
  },

  comments: {
    marginTop: 10,
    padding: 10,
    background: '#000'
  },

  textarea: {
    width: '100%',
    minHeight: 70,
    marginTop: 5
  },

  comment: {
    marginTop: 10,
    padding: 10,
    borderBottom: '1px solid #222'
  },

  editor: {
    padding: 10,
    background: '#222',
    marginTop: 10
  }
};
