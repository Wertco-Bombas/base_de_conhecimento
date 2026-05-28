import { useEffect, useState, useMemo, memo } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { canApprove } from '../lib/permissions';
import { uploadImage } from '../lib/uploadImage';


export default function Base() {
  const [user, setUser] = useState(null);
  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);
  const [categories, setCategories] = useState([]);

  const [q, setQ] = useState('');
  const [commentInput, setCommentInput] = useState({});
  const [replyInput, setReplyInput] = useState({});
  const [commentImage, setCommentImage] = useState({});

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showTopic, setShowTopic] = useState(false);
  const [showDeleteCategory, setShowDeleteCategory] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [topicImage, setTopicImage] = useState(null);

  const [openImage, setOpenImage] = useState(null);

  const [newTopic, setNewTopic] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState('');

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user;

      setUser(currentUser || null);

      if (!currentUser) return;

      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!existing) {
        await supabase.from('profiles').insert({
          id: currentUser.id,
          email: currentUser.email,
          role: 'usuario'
        });
      }
    }


  init();
  load();
}, []);

async function load() {
  const { data: t, error: e1 } = await supabase
    .from('topicos')
    .select('*');

  const { data: cats, error: e2 } = await supabase
    .from('categorias')
    .select('*');

  const { data: c, error: e3 } = await supabase
    .from('comentarios')
    .select('*');

  if (e1 || e2 || e3) {
    console.error(e1 || e2 || e3);
  }

    const tFinal = (t || []).map(topic => ({
      ...topic,
      categorias: cats?.find(c => c.id === topic.categoria_id) || null
    }));

    setTopics(tFinal || []);
    setComments(c || []);
    setCategories(cats || []);
  }

  async function createTopic() {
    if (!user) return alert('Faça login');
    if (!newTopic || !newCat) return alert('Preencha título e categoria');
    let imageUrl = null;

if (topicImage) {
  imageUrl = await uploadImage(topicImage);
}

    const { data: catData, error: catError } = await supabase
      .from('categorias')
      .select('id')
      .eq('nome', newCat)
      .single();

    if (catError || !catData) return alert('Categoria não encontrada');

    const { error } = await supabase.from('topicos').insert({
      image_url: imageUrl,
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

 async function addComment(topicId, parentId = null, texto = null, imageFile = null) {
  if (!user) return alert('Faça login');

  const text = texto || commentInput[topicId];

  if (!text?.trim() && !imageFile) return;

  let imageUrl = null;

  if (imageFile) {
    imageUrl = await uploadImage(imageFile);
  }

  const { error } = await supabase.from('comentarios').insert({
    topic_id: topicId,
    parent_id: parentId,
    texto: text || '',
    image_url: imageUrl,
    user_email: user?.email,
    created_at: new Date().toISOString(),
    status: canApprove(user) ? 'approved' : 'pending'
  });

if (error) return alert(error.message);

setCommentInput(prev => ({
  ...prev,
  [topicId]: ''
}));

setCommentImage(prev => ({
  ...prev,
  [topicId]: null
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
  if (!newCategoryName?.trim()) {
    return alert('Digite uma categoria');
  }

  const { error } = await supabase
    .from('categorias')
    .insert({
      nome: newCategoryName
    });

  if (error) return alert(error.message);

  setNewCategoryName('');
  setShowCategoryModal(false);

  load();
}

  async function deleteCategory() {
    setShowDeleteCategory(true);
  }

  async function confirmDeleteCategories() {
    if (!selectedCategories.length) {
      return alert('Selecione categorias');
    }

    const confirmar = confirm(
      `Excluir categorias:\n\n${selectedCategories.join('\n')}`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from('categorias')
      .delete()
      .in('nome', selectedCategories);

    if (error) return alert(error.message);

    setSelectedCategories([]);
    setShowDeleteCategory(false);

    load();
  }

  function toggleCategory(nome) {
    setSelectedCategories(prev =>
      prev.includes(nome)
        ? prev.filter(n => n !== nome)
        : [...prev, nome]
    );
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
        children: buildTree(list, c.id, topicId) || []
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

  const commentTrees = useMemo(() => {
    const map = {};

    visibleTopics.forEach(topic => {
      map[topic.id] = buildTree(comments, null, topic.id);
    });

    return map;
  }, [comments, visibleTopics]);

  function formatDate(date) {
    if (!date) return '';

    return new Date(date).toLocaleString('pt-BR');
  }

const ReplyBox = memo(function ReplyBox({
  commentId,
  topicId,
  addComment
}) {
  const [localText, setLocalText] = useState('');
  const [localImage, setLocalImage] = useState(null);

  return (
    <div style={{
      marginTop: 10,
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      width: '100%'
    }}>

      <textarea
        className="mobileInput"
        rows={3}
        placeholder="Escreva uma resposta..."
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        style={{
          ...styles.input,
          flex: 1
        }}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setLocalImage(e.target.files[0])}
      />

      <button
        style={styles.mainBtn}
        onClick={async () => {
          await addComment(
            topicId,
            commentId,
            localText,
            localImage
          );
          setLocalText('');
          setLocalImage(null);
        }}
      >
        enviar
      </button>

    </div>
  );
});
  const CommentNode = memo(function CommentNode({
  comment,
  level = 0,
  setOpenImage
}) {
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

      <div
        style={{
          ...styles.commentText,
          whiteSpace: 'pre-line'
        }}
      >
        💬 {comment.texto}

       {comment.image_url && (
  <img
    src={comment.image_url}
    onClick={() => setOpenImage(comment.image_url)}
    style={{
      width: '100%',
      marginTop: 10,
      borderRadius: 10,
      maxHeight: 180,
      objectFit: 'contain',
      background: '#000',
      cursor: 'zoom-in'
    }}
  />
)}
      </div>

      <div style={styles.commentActions}>
        <button
          style={styles.smallBtn}
          onClick={() =>
            setReplyInput(prev => ({
              ...prev,
              [comment.id]: prev[comment.id] ?? true
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

      {replyInput[comment.id] && (
        <ReplyBox
          commentId={comment.id}
          topicId={comment.topic_id}
          addComment={addComment}
        />
      )}

      {comment.children?.length > 0 &&
        comment.children.map(child => (
          <CommentNode
  key={child.id}
  comment={child}
  level={level + 1}
  setOpenImage={setOpenImage}
/>
        ))}
    </div>
  );
});

/* 🔥 MODAL DA IMAGEM (DEVE FICAR FORA DO COMPONENTE AUXILIAR, MAS DENTRO DO RETURN PRINCIPAL) */


return (
  <Layout>
  {openImage && (
  <div
    onClick={() => setOpenImage(null)}
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      cursor: 'zoom-out'
    }}
  >
    <img
      src={openImage}
      style={{
        maxWidth: '95%',
        maxHeight: '95%',
        borderRadius: 12
      }}
    />
  </div>
)}

    <input
      className="mobileInput"
      placeholder="Buscar tópicos e comentários..."
      value={q}
      onChange={e => setQ(e.target.value)}
      style={styles.search}
    />

    <div style={styles.topBar}>
      <button
        style={styles.mainBtn}
        onClick={() => setShowTopic(true)}
      >
        + Novo Tópico
      </button>

<button
  style={styles.mainBtn}
  onClick={() => setShowCategoryModal(true)}
>
  + Nova Categoria
</button>

        <button
          style={styles.smallBtnDanger}
          onClick={deleteCategory}
        >
          Excluir Categoria
        </button>
      </div>

     {visibleTopics?.map(topic => {
  const tree = commentTrees[topic.id] || [];

  return (
    <div key={topic.id} style={styles.card} className="mobileCard">

      <div style={styles.header} className="mobileHeader">
        <div>
          <h2 style={styles.title}>{topic.titulo}</h2>

          <div style={styles.category}>
            {topic.categorias?.nome}
          </div>
        </div>

        <button
          style={styles.smallBtnDanger}
          onClick={() => deleteTopic(topic.id)}
        >
          excluir tópico
        </button>
      </div>

      <p
  style={{
    ...styles.desc,
    whiteSpace: 'pre-line'
  }}
>
  {topic.descricao}
{topic.image_url && (
  <img
    src={topic.image_url}
    alt=""
   style={{
  width: '100%',
  marginTop: 10,
  borderRadius: 10,
  maxHeight: 500,
  objectFit: 'contain',
  background: '#000'
}}
  />
)}
</p>

 <div style={styles.meta}>
  <span>{topic.user_email}</span>
  <span>{formatDate(topic.created_at)}</span>
</div>

<div style={{ marginTop: 20 }}>
  {tree?.map(comment => (
    <CommentNode
      key={comment.id}
      comment={comment}
      setOpenImage={setOpenImage}
    />
  ))}
</div>

<div style={styles.row} className="mobileRow">

  <textarea
    className="mobileInput"
    rows={4}
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
    onClick={() =>
      addComment(
        topic.id,
        null,
        commentInput[topic.id],
        null
      )
    }
  >
    enviar
  </button>

</div>

<input
  type="file"
  accept="image/*"
  onChange={(e) =>
    setTopicImage(e.target.files[0])
  }
  style={{
    marginTop: 10,
    color: '#fff'
  }}
/>

     <div style={{ position: 'relative' }}>
  <button
    type="button"
    style={{
      ...styles.input,
      textAlign: 'left',
      cursor: 'pointer',
      width: '100%'
    }}
    onClick={() =>
      setShowCategorySelector(prev => !prev)
    }
  >
    
  </button>

  {showCategorySelector && (
    <div
      style={{
        position: 'absolute',
        top: '105%',
        left: 0,
        right: 0,
        background: '#111',
        border: '1px solid #333',
        borderRadius: 12,
        zIndex: 999,
        maxHeight: 220,
        overflowY: 'auto'
      }}
    >
      {categories?.map(cat => (
        <div
          key={cat.id}
          onClick={() => {
            setNewCat(cat.nome);
            setShowCategorySelector(false);
          }}
          style={{
            padding: 12,
            cursor: 'pointer',
            borderBottom: '1px solid #222'
          }}
        >
          {cat.nome}
        </div>
      ))}
    </div>
  )}
</div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap'
        }}
      >
        <button
          style={styles.mainBtn}
          onClick={createTopic}
        >
          salvar
        </button>

        <button
          style={styles.smallBtn}
          onClick={() => setShowTopic(false)}
        >
          fechar
        </button>
      </div>
     </div>
  );
})}

      {showDeleteCategory && (
        <div style={styles.modal}>
          <div
            style={{
              ...styles.modalBox,
              width: '90%',
              maxWidth: 500
            }}
          >
            <h2 style={{ color: '#FFD600' }}>
              Excluir Categorias
            </h2>

            <div
              style={{
                maxHeight: 300,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              {categories.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => toggleCategory(cat.nome)}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    cursor: 'pointer',
                    border: '1px solid #333',
                    background:
                      selectedCategories.includes(cat.nome)
                        ? '#FFD600'
                        : '#111',
                    color:
                      selectedCategories.includes(cat.nome)
                        ? '#000'
                        : '#fff'
                  }}
                >
                  {cat.nome}
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 15,
                flexWrap: 'wrap'
              }}
            >
              <button
                style={styles.mainBtn}
                onClick={confirmDeleteCategories}
              >
                excluir selecionadas
              </button>

              <button
                style={styles.smallBtn}
                onClick={() => setShowDeleteCategory(false)}
              >
                fechar
              </button>
            </div>
          </div>
        </div>
      )}
        {showCategoryModal && (
  <div style={styles.modal}>
    <div
      style={{
        ...styles.modalBox,
        width: '90%',
        maxWidth: 450,
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}
    >
      <h2 style={{ color: '#FFD600' }}>
        Nova Categoria
      </h2>

      <input
        className="mobileInput"
        style={styles.input}
        placeholder="Nome da categoria"
        value={newCategoryName}
        onChange={e => setNewCategoryName(e.target.value)}
      />

      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap'
        }}
      >
        <button
          style={styles.mainBtn}
          onClick={createCategory}
        >
          salvar
        </button>

        <button
          style={styles.smallBtn}
          onClick={() => setShowCategoryModal(false)}
        >
          fechar
        </button>
      </div>
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
    marginBottom: 20
  },

  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    color: '#fff'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap'
  },

  title: {
    margin: 0,
    fontSize: 24
  },

  category: {
    display: 'inline-block',
    marginTop: 8,
    background: '#FFD600',
    color: '#000',
    padding: '5px 10px',
    borderRadius: 999
  },

  desc: {
    color: '#bbb',
    marginTop: 16
  },

  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 16,
    color: '#777',
    gap: 10,
    flexWrap: 'wrap'
  },

  row: {
    display: 'flex',
    gap: 10,
    marginTop: 20,
    flexWrap: 'wrap'
  },

  input: {
    flex: 1,
    background: '#0b0b0b',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    minWidth: 0
  },

  mainBtn: {
    background: '#FFD600',
    color: '#000',
    border: 'none',
    borderRadius: 12,
    padding: '12px 18px',
    cursor: 'pointer'
  },

  smallBtn: {
    background: 'transparent',
    border: '1px solid #FFD600',
    color: '#FFD600',
    padding: '6px 10px',
    cursor: 'pointer'
  },

  smallBtnDanger: {
    background: 'transparent',
    border: '1px solid #ff4d4d',
    color: '#ff4d4d',
    padding: '6px 10px',
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
    fontSize: 11,
    gap: 10,
    flexWrap: 'wrap'
  },

  commentText: {
    marginTop: 8,
    color: '#eee',
    wordBreak: 'break-word'
  },

  commentActions: {
    display: 'flex',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap'
  },

  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999
  },

  modalBox: {
    background: '#111',
    border: '1px solid #FFD600',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    color: '#fff'
  }
};
