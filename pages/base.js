import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { canApprove } from '../lib/permissions';
import { uploadImage } from '../lib/uploadImage';


export default function Base() {
  const [user, setUser] = useState(null);
  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);
  const [categories, setCategories] = useState([]);

  const [pendingComments, setPendingComments] = useState([]);
  

  const [q, setQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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

  const [showPendingPopup, setShowPendingPopup] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const [editingComment, setEditingComment] = useState(null);


const [editingTopic, setEditingTopic] = useState(null);
const [editingTopicTitle, setEditingTopicTitle] = useState('');
const [editingTopicDesc, setEditingTopicDesc] = useState('');
const sortedCategories = useMemo(() => {
  return [...categories].sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
  );
}, [categories]);
  
useEffect(() => {
  async function init() {
    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData?.user;

    if (!currentUser) {
      setUser(null);
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (error) console.error(error);

    // cria profile se não existir
    if (!profile) {
      await supabase.from('profiles').insert({
        id: currentUser.id,
        email: currentUser.email,
        role: 'usuario'
      });
    }

    setUser({
      id: currentUser.id,
      email: currentUser.email,
      role: profile?.role || 'usuario'
    });

    load(profile?.role || 'usuario');
  }

  init();
}, []);
  useEffect(() => {
  if (!user) return;

  const pendingTopics = topics.filter(x => x.status === 'pending');
  const pendingComments = comments.filter(x => x.status === 'pending');

  const totalPending = pendingTopics.length + pendingComments.length;

  setPendingCount(totalPending);

  if (user?.role === 'supervisor' && totalPending > 0) {
    setShowPendingPopup(true);
  }
}, [user, topics, comments]);
  async function updateTopic() {
  if (!editingTopic) return;

  const { error } = await supabase
    .from('topicos')
    .update({
      titulo: editingTopicTitle,
      descricao: editingTopicDesc,
      updated_at: new Date().toISOString()
    })
    .eq('id', editingTopic);

  if (error) {
    alert(error.message);
    return;
  }

  setEditingTopic(null);
  load(user?.role);
}

async function load(currentRole = user?.role) {
  const { data: t } = await supabase
    .from('topicos')
    .select('*');

  const { data: cats } = await supabase
    .from('categorias')
    .select('*');

  // ✅ base de conhecimento (aprovados)
  const { data: approvedComments } = await supabase
    .from('comentarios')
    .select('*')
    .eq('status', 'approved');

  // 🚨 fila de aprovação (pendentes)
  const { data: pendingComments } = await supabase
    .from('comentarios')
    .select('*')
    .eq('status', 'pending');

  const tFinal = (t || []).map(topic => ({
    ...topic,
    categorias: cats?.find(c => c.id === topic.categoria_id) || null
  }));

  setTopics(tFinal || []);
  setCategories(cats || []);

  // 👇 ESSA LINHA MUDA O JOGO
  setComments(approvedComments || []);

  // 🔥 você ainda NÃO tem isso no state
  setPendingComments(pendingComments || []);
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

    load(user?.role);
  }
async function updateComment(id, text) {
  const { error } = await supabase
    .from('comentarios')
    .update({
      texto: text
    })
    .eq('id', id);

  if (error) {
    alert(error.message);
    return;
  }

  setEditingComment(null);
  load(user?.role);
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

load(user?.role);
}
  async function deleteTopic(id) {
    const confirmar = confirm('Excluir tópico?');

    if (!confirmar) return;

    await supabase.from('topicos').delete().eq('id', id);

    load(user?.role);
  }

  async function deleteComment(id) {
    const confirmar = confirm('Excluir comentário?');

    if (!confirmar) return;

    await supabase.from('comentarios').delete().eq('id', id);

    load(user?.role);
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

  load(user?.role);
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

    load(user?.role);
  }

  function toggleCategory(nome) {
    setSelectedCategories(prev =>
      prev.includes(nome)
        ? prev.filter(n => n !== nome)
        : [...prev, nome]
    );
  }

  const buildTree = useCallback((list, parentId = null, topicId = null, userRole) => {
  parentId = parentId ? String(parentId) : null;

  return list
    .filter(c =>
      String(c.parent_id ?? null) === String(parentId ?? null) &&
      String(c.topic_id ?? null) === String(topicId ?? null) &&
      (c.status === 'approved' || userRole === 'admin')
    )
    .map(c => ({
      ...c,
      children: buildTree(list, c.id, topicId, userRole)
    }));
}, []);

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

    const categoryMatch =
      !categoryFilter ||
      t.categorias?.nome === categoryFilter;

    return (
      (topicMatch || commentMatch) &&
      categoryMatch
    );
  });
}, [
  topics,
  comments,
  q,
  categoryFilter
]);

const visibleTopics = useMemo(() => {
  if (!user) return [];

  // supervisor e admin veem tudo
  if (user.role === 'admin' || user.role === 'supervisor') {
    return filteredTopics;
  }

  // usuário normal só vê aprovados
  return filteredTopics.filter(t => t.status === 'approved');
}, [filteredTopics, user]);

const commentTrees = useMemo(() => {
  const map = {};

  visibleTopics.forEach(topic => {
    map[topic.id] = buildTree(
      comments,
      null,
      topic.id,
      user?.role
    );
  });

  return map;
}, [
  comments,
  user?.role,
  visibleTopics.length
]);

  function formatDate(date) {
    if (!date) return '';

    return new Date(date).toLocaleString('pt-BR');
  }

function ReplyBox({
  commentId,
  topicId,
  addComment
}) {
  const [localText, setLocalText] = useState('');
  const [localImage, setLocalImage] = useState(null);
  
   useEffect(() => {
    console.log('ReplyBox montou:', commentId);
  }, []);

  return (
    <div
      style={{
        marginTop: 10,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        width: '100%'
      }}
    >
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
}
const renderNetworkText = (text) => {
  function convertPathToUrl(path) {
  if (!path) return '';

  // converte \ser-sp-001\dados\arquivo.pdf
  // para http://ser-sp-001/dados/arquivo.pdf

  if (path.startsWith('\\\\ser-sp-001')) {
    return path
      .replace('\\\\ser-sp-001', 'http://ser-sp-001')
      .replace(/\\/g, '/');
  }

  return path;
}

  
  if (!text) return null;

  const lines = text.split('\n');

  return lines.map((line, i) => {
    const isPath = line.trim().startsWith('\\\\');

    if (isPath) {
      const clean = line.trim();

      return (
        <div key={i} style={{ marginBottom: 6 }}>
          📎 {clean}

          <button
            onClick={() => {
              navigator.clipboard.writeText(clean);
              alert("Caminho copiado!");
            }}
            style={{
              marginLeft: 8,
              background: 'transparent',
              border: '1px solid #FFD600',
              color: '#FFD600',
              padding: '2px 6px',
              cursor: 'pointer',
              borderRadius: 4,
              fontSize: 12
            }}
          >
            copiar
          </button>

          <button
            onClick={() => window.open(clean, '_blank')}
            style={{
              marginLeft: 8,
              background: '#FFD600',
              border: 'none',
              color: '#000',
              padding: '2px 6px',
              cursor: 'pointer',
              borderRadius: 4,
              fontSize: 12
            }}
          >
            abrir
          </button>
        </div>
      );
    }

    return <div key={i}>{line}</div>;
  });
};
function CommentNode({
  comment,
  level = 0,
  setOpenImage
}) {
  const [editText, setEditText] = useState(comment.texto || '');
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

     {editingComment === comment.id ? (
  <>
    <textarea
      value={editText}
      onChange={(e) => setEditText(e.target.value)}
      style={{
        ...styles.input,
        marginTop: 10
      }}
      rows={4}
    />

    <div style={{ marginTop: 10 }}>
      <button
        style={styles.mainBtn}
        onClick={() => updateComment(comment.id, editText)}
      >
        salvar
      </button>

      <button
        style={{
          ...styles.smallBtn,
          marginLeft: 10
        }}
        onClick={() => {
          setEditingComment(null);
          setEditText(comment.texto || '');
        }}
      >
        cancelar
      </button>
    </div>
  </>
) : (
  <>
    <div style={styles.commentText}>
      💬 {renderNetworkText(comment.texto)}
    </div>

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
  </>
)}
      <div style={styles.commentActions}>
        {(
          user?.role === 'admin' ||
          user?.role === 'supervisor' ||
          comment.user_email === user?.email
        ) && (
          <button
            style={styles.smallBtn}
            onClick={() => {
  setEditingComment(comment.id);

  setEditingTexts(prev => ({
    ...prev,
    [comment.id]: comment.texto || ''
  }));
}}
          >
            editar
          </button>
        )}

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

        {(
          user?.role === 'admin' ||
          user?.role === 'supervisor' ||
          comment.user_email === user?.email
        ) && (
          <button
            style={styles.smallBtnDanger}
            onClick={() => deleteComment(comment.id)}
          >
            excluir
          </button>
        )}
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
}
/* 🔥 MODAL DA IMAGEM (DEVE FICAR FORA DO COMPONENTE AUXILIAR, MAS DENTRO DO RETURN PRINCIPAL) */


return (
  <Layout>
  {showPendingPopup && user?.role === 'supervisor' && (
  <div style={styles.modal}>
    <div style={styles.modalBox}>
      <h2 style={{ color: '#FFD600' }}>
        Pendências de aprovação
      </h2>

      <p>
        Existem <b>{pendingCount}</b> itens aguardando aprovação.
      </p>

      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        
        <button
          style={styles.mainBtn}
          onClick={() => {
            setShowPendingPopup(false);

            // 👉 aqui você pode rolar até uma seção ou abrir modal
            document.getElementById('pending-section')?.scrollIntoView({
              behavior: 'smooth'
            });
          }}
        >
          ir para aprovação
        </button>

        <button
          style={styles.smallBtn}
          onClick={() => setShowPendingPopup(false)}
        >
          fechar
        </button>

      </div>
    </div>
  </div>
)}
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
        <select
  value={categoryFilter}
  onChange={(e) => setCategoryFilter(e.target.value)}
  style={styles.categorySelect}
>
  <option value="">Todas as categorias</option>

{[...categories]
  .sort((a, b) => a.nome.localeCompare(b.nome))
  .map(cat => (
    <option key={cat.id} value={cat.nome}>
      {cat.nome}
    </option>
))}
</select>

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
    {(
  user?.role === 'admin' ||
  user?.role === 'supervisor'
) && (
  <button
    style={styles.smallBtnDanger}
    onClick={deleteCategory}
  >
    Excluir Categoria
  </button>
)}

       
      </div>

     {visibleTopics?.map(topic => {
  const tree = commentTrees[topic.id] || [];

  return (
    <div key={topic.id} style={styles.card} className="mobileCard">

      <div style={styles.header} className="mobileHeader">
        <div>
       {editingTopic === topic.id ? (
  <>
    <input
      value={editingTopicTitle}
      onChange={(e) =>
        setEditingTopicTitle(e.target.value)
      }
      style={styles.input}
    />

    <textarea
      rows={6}
      value={editingTopicDesc}
      onChange={(e) =>
        setEditingTopicDesc(e.target.value)
      }
      style={{
        ...styles.input,
        marginTop: 10
      }}
    />

    <div style={{ marginTop: 10 }}>
      <button
        style={styles.mainBtn}
        onClick={updateTopic}
      >
        salvar
      </button>

      <button
        style={{
          ...styles.smallBtn,
          marginLeft: 10
        }}
        onClick={() => setEditingTopic(null)}
      >
        cancelar
      </button>
    </div>
  </>
) : (
  <h2 style={styles.title}>
    {topic.titulo}
  </h2>
)}
          

          <div style={styles.category}>
            {topic.categorias?.nome}
          </div>
        </div>

   {(
  user?.role === 'admin' ||
  user?.role === 'supervisor' ||
  topic.user_email === user?.email
) && (
  <>
    <button
      style={styles.smallBtn}
      onClick={() => {
        setEditingTopic(topic.id);
        setEditingTopicTitle(topic.titulo);
        setEditingTopicDesc(topic.descricao);
      }}
    >
      editar tópico
    </button>

    <button
      style={styles.smallBtnDanger}
      onClick={() => deleteTopic(topic.id)}
    >
      excluir tópico
    </button>
  </>
)}
      </div>

     {editingTopic !== topic.id && (
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
)}
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
  onChange={(e) =>
    setCommentInput(prev => ({
      ...prev,
      [topic.id]: e.target.value
    }))
  }
  style={styles.input}
/>
  <label style={styles.iconFileBtn}>
  📷
  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setCommentImage(prev => ({
        ...prev,
        [topic.id]: e.target.files[0]
      }))
    }
    style={{ display: 'none' }}
  />
</label>

  <button
    style={styles.mainBtn}
    onClick={() =>
      addComment(
        topic.id,
        null,
        commentInput[topic.id],
        commentImage?.[topic.id]
      )
    }
  >
    enviar
  </button>

</div>

     </div>
  );
})}
{showTopic && (
  <div style={styles.modal}>
    <div
      style={{
        ...styles.modalBox,
        width: '90%',
        maxWidth: 600,
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}
    >

      <h2 style={{ color: '#FFD600' }}>
        Novo Tópico
      </h2>

      <input
        className="mobileInput"
        style={styles.input}
        placeholder="Título"
        value={newTopic}
        onChange={e => setNewTopic(e.target.value)}
      />

      <textarea
        className="mobileInput"
        rows={5}
        style={styles.input}
        placeholder="Descrição"
        value={newDesc}
        onChange={e => setNewDesc(e.target.value)}
      />

      <select
  value={newCat}
  onChange={e => setNewCat(e.target.value)}
  style={styles.input}
>
  <option value="">Escolha uma categoria</option>

  {sortedCategories.map(cat => (
    <option key={cat.id} value={cat.nome}>
      {cat.nome}
    </option>
  ))}
</select>
      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setTopicImage(e.target.files[0])
        }
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
  </div>
)}

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
              {sortedCategories.map(cat => (
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
    maxHeight: 220,
    overflowY: 'auto',
    border: '1px solid #333',
    borderRadius: 12,
    background: '#0b0b0b',
    padding: 10
  }}
>
  <div
    style={{
      marginBottom: 10,
      color: '#FFD600',
      fontWeight: 'bold'
    }}
  >
    Categorias existentes
  </div>

  {categories.length === 0 ? (
  <div style={{ color: '#777' }}>
    Nenhuma categoria cadastrada
  </div>
) : (
  sortedCategories.map(cat => (
    <div
      key={cat.id}
      style={{
        padding: '8px 10px',
        borderBottom: '1px solid #222',
        color: '#fff'
      }}
    >
      {cat.nome}
    </div>
  ))
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
  iconFileBtn: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 44,
  height: 44,
  borderRadius: 12,
  background: '#0b0b0b',
  border: '1px solid #FFD600',
  color: '#FFD600',
  fontSize: 22,
  cursor: 'pointer',
  transition: '0.2s ease',
  userSelect: 'none'
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
},

  categorySelect: {
  width: '100%',
  padding: '14px 16px',
  marginBottom: 20,
  background: '#111',
  color: '#FFD600',
  border: '2px solid #FFD600',
  borderRadius: 14,
  fontSize: 16,
  fontWeight: 'bold',
  outline: 'none',
  cursor: 'pointer',
  boxShadow: '0 0 12px rgba(255,214,0,0.25)'
}
};
