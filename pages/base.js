import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Base() {

  const [user, setUser] = useState(null);

  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);

  const [q, setQ] = useState('');
  const [commentInput, setCommentInput] = useState({});

  const [showTopic, setShowTopic] = useState(false);

  // 🔥 NOVO (modal resposta)
  const [replyModal, setReplyModal] = useState({
    open: false,
    comment: null,
    text: ''
  });

  const [newTopic, setNewTopic] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState('');

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

    setTopics(t || []);
    setComments(c || []);
  }

  async function createTopic() {

    if (!newTopic || !newCat) {
      alert('Preencha título e categoria');
      return;
    }

    const { error } = await supabase
      .from('topicos')
      .insert({
        titulo: newTopic,
        descricao: newDesc,
        categoria: newCat,
        user_email: user?.email,
        created_at: new Date().toISOString()
      });

    if (error) {
      alert(error.message);
      return;
    }

    setNewTopic('');
    setNewDesc('');
    setNewCat('');

    setShowTopic(false);

    load();
  }

  async function addComment(topicId, parentId = null, texto = null) {

    const text = texto || commentInput[topicId];

    if (!text?.trim()) return;

    const { error } = await supabase
      .from('comentarios')
      .insert({
        topic_id: topicId,
        parent_id: parentId,
        texto: text,
        user_email: user?.email,
        created_at: new Date().toISOString()
      });

    if (error) {
      alert(error.message);
      return;
    }

    setCommentInput(prev => ({
      ...prev,
      [topicId]: ''
    }));

    load();
  }

  async function deleteTopic(id) {

    const confirmar = confirm('Excluir tópico?');

    if (!confirmar) return;

    await supabase
      .from('topicos')
      .delete()
      .eq('id', id);

    load();
  }

  async function deleteComment(id) {

    const confirmar = confirm('Excluir comentário?');

    if (!confirmar) return;

    await supabase
      .from('comentarios')
      .delete()
      .eq('id', id);

    load();
  }

  async function createCategory() {

    const nome = prompt('Nome da categoria');

    if (!nome) return;

    const { error } = await supabase
      .from('categorias')
      .insert({ nome });

    if (error) {
      alert(error.message);
      return;
    }

    alert('Categoria criada');
  }

  async function deleteCategory() {

    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome');

    if (error) {
      alert(error.message);
      return;
    }

    const lista = data
      .map((c, i) => `${i + 1} - ${c.nome}`)
      .join('\n');

    const resposta = prompt(
      `Categorias disponíveis:\n\n${lista}\n\nDigite os números separados por vírgula.`
    );

    if (!resposta) return;

    const indexes = resposta
      .split(',')
      .map(v => parseInt(v.trim()) - 1)
      .filter(v => v >= 0);

    const categoriasSelecionadas = indexes
      .map(i => data[i]?.nome)
      .filter(Boolean);

    const confirmar = confirm(
      `Excluir categorias:\n\n${categoriasSelecionadas.join('\n')}`
    );

    if (!confirmar) return;

    await supabase
      .from('categorias')
      .delete()
      .in('nome', categoriasSelecionadas);

    load();
  }

  function buildTree(list, parentId = null, topicId = null) {

    return list
      .filter(c =>
        c.parent_id === parentId &&
        c.topic_id === topicId
      )
      .map(c => ({
        ...c,
        children: buildTree(list, c.id, topicId)
      }));
  }

  const filteredTopics = topics.filter(t => {

    const topicMatch =
      `${t.titulo} ${t.descricao} ${t.categoria}`
        .toLowerCase()
        .includes(q.toLowerCase());

    const commentMatch = comments.some(c =>
      c.topic_id === t.id &&
      c.texto?.toLowerCase().includes(q.toLowerCase())
    );

    return topicMatch || commentMatch;
  });

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleString('pt-BR');
  }

  function CommentNode({ comment, level = 0 }) {

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

        <div style={styles.commentText}>
          💬 {comment.texto}
        </div>

        <div style={styles.commentActions}>

          {/* 🔥 AGORA ABRE MODAL EM VEZ DE PROMPT */}
          <button
            style={styles.smallBtn}
            onClick={() =>
              setReplyModal({
                open: true,
                comment,
                text: ''
              })
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

        {comment.children?.length > 0 && (
          <div>
            {comment.children.map(child => (
              <CommentNode
                key={child.id}
                comment={child}
                level={level + 1}
              />
            ))}
          </div>
        )}

      </div>
    );
  }

  return (
    <Layout>

      {/* SEARCH */}
      <input
        placeholder="Buscar tópicos e comentários..."
        value={q}
        onChange={e => setQ(e.target.value)}
        style={styles.search}
      />

      {/* TOP BUTTONS */}
      <div style={styles.topBar}>

        <button
          style={styles.mainBtn}
          onClick={() => setShowTopic(true)}
        >
          + Novo Tópico
        </button>

        <button
          style={styles.mainBtn}
          onClick={createCategory}
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

      {/* TOPICS */}
      {filteredTopics.map(topic => {

        const tree = buildTree(
          comments,
          null,
          topic.id
        );

        return (
          <div key={topic.id} style={styles.card}>

            <div style={styles.header}>
              <div>
                <h2 style={styles.title}>{topic.titulo}</h2>
                <div style={styles.category}>{topic.categoria}</div>
              </div>

              <button
                style={styles.smallBtnDanger}
                onClick={() => deleteTopic(topic.id)}
              >
                excluir tópico
              </button>
            </div>

            <p style={styles.desc}>{topic.descricao}</p>

            <div style={styles.meta}>
              <span>{topic.user_email}</span>
              <span>{formatDate(topic.created_at)}</span>
            </div>

            <div style={{ marginTop: 20 }}>
              {tree.map(comment => (
                <CommentNode key={comment.id} comment={comment} />
              ))}
            </div>

            <div style={styles.row}>
              <input
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
                onClick={() => addComment(topic.id)}
              >
                enviar
              </button>
            </div>

          </div>
        );
      })}

      {/* MODAL NOVO TÓPICO */}
      {showTopic && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h2 style={{ color: '#FFD600' }}>Novo Tópico</h2>

            <input style={styles.input} placeholder="Título"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
            />

            <textarea style={styles.input} placeholder="Descrição"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />

            <input style={styles.input} placeholder="Categoria"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
            />

            <button style={styles.mainBtn} onClick={createTopic}>
              salvar
            </button>

            <button style={styles.smallBtn} onClick={() => setShowTopic(false)}>
              fechar
            </button>
          </div>
        </div>
      )}

      {/* 🔥 MODAL RESPONDER COMENTÁRIO */}
      {replyModal.open && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>

            <h2 style={{ color: '#FFD600' }}>Responder comentário</h2>

            <textarea
              style={styles.input}
              value={replyModal.text}
              onChange={(e) =>
                setReplyModal(prev => ({
                  ...prev,
                  text: e.target.value
                }))
              }
            />

            <button
              style={styles.mainBtn}
              onClick={() => {
                addComment(
                  replyModal.comment.topic_id,
                  replyModal.comment.id,
                  replyModal.text
                );

                setReplyModal({
                  open: false,
                  comment: null,
                  text: ''
                });
              }}
            >
              enviar resposta
            </button>

            <button
              style={styles.smallBtn}
              onClick={() =>
                setReplyModal({
                  open: false,
                  comment: null,
                  text: ''
                })
              }
            >
              cancelar
            </button>

          </div>
        </div>
      )}

    </Layout>
  );
}

/* styles continuam iguais */
