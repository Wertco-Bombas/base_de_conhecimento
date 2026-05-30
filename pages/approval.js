import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Approval() {
  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [openImage, setOpenImage] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: auth } = await supabase.auth.getUser();

    if (!auth?.user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', auth.user.id)
      .maybeSingle();

    const role = profile?.role || 'user';

    setUser({ id: auth.user.id, role });

    if (role !== 'admin' && role !== 'supervisor') {
      window.location.href = '/';
      return;
    }

    load();
    setLoading(false);
  }

  async function load() {
    const { data: t } = await supabase
      .from('topicos')
      .select('*')
      .eq('status', 'pending')
      .order('id', { ascending: false });

    const { data: c } = await supabase
      .from('comentarios')
      .select('*')
      .eq('status', 'pending')
      .order('id', { ascending: false });

    setTopics(t || []);
    setComments(c || []);
  }

  async function approveTopic(id) {
    if (!user) return;

    await supabase
      .from('topicos')
      .update({ status: 'approved' })
      .eq('id', id);

    load();
  }

  async function rejectTopic(id) {
    if (!user) return;

    await supabase
      .from('topicos')
      .update({ status: 'rejected' })
      .eq('id', id);

    load();
  }

  async function approveComment(id) {
    if (!user) return;

    await supabase
      .from('comentarios')
      .update({ status: 'approved' })
      .eq('id', id);

    load();
  }

  async function rejectComment(id) {
    if (!user) return;

    await supabase
      .from('comentarios')
      .update({ status: 'rejected' })
      .eq('id', id);

    load();
  }

  if (loading) return <div style={{ color: '#fff' }}>Carregando...</div>;

  return (
    <Layout>
      <h1 style={{ color: '#FFD600' }}>Aprovação</h1>

      {/* MODAL IMAGEM */}
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

      <h2 style={{ color: '#fff' }}>Tópicos pendentes</h2>

      {topics.map(t => (
        <div
          key={t.id}
          style={{
            padding: 12,
            border: '1px solid #333',
            marginBottom: 10,
            color: '#fff',
            borderRadius: 10
          }}
        >
          <h3>{t.titulo}</h3>

          <p style={{ color: '#aaa' }}>
            Categoria: <b>{t.categoria || 'não definida'}</b>
          </p>

          <p>{t.descricao}</p>

          {t.image_url && (
            <img
              src={t.image_url}
              onClick={() => setOpenImage(t.image_url)}
              style={{
                width: '100%',
                marginTop: 10,
                borderRadius: 10,
                maxHeight: 220,
                objectFit: 'contain',
                cursor: 'zoom-in',
                background: '#000'
              }}
            />
          )}

          <div style={{ marginTop: 10 }}>
            <button onClick={() => approveTopic(t.id)}>Aprovar</button>
            <button onClick={() => rejectTopic(t.id)}>Rejeitar</button>
          </div>
        </div>
      ))}

      <h2 style={{ color: '#fff', marginTop: 20 }}>
        Comentários pendentes
      </h2>

      {comments.map(c => (
        <div
          key={c.id}
          style={{
            padding: 12,
            border: '1px solid #333',
            marginBottom: 10,
            color: '#fff',
            borderRadius: 10
          }}
        >
          <p>{c.texto}</p>

          {c.image_url && (
            <img
              src={c.image_url}
              onClick={() => setOpenImage(c.image_url)}
              style={{
                width: '100%',
                marginTop: 10,
                borderRadius: 10,
                maxHeight: 180,
                objectFit: 'contain',
                cursor: 'zoom-in',
                background: '#000'
              }}
            />
          )}

          <div style={{ marginTop: 10 }}>
            <button onClick={() => approveComment(c.id)}>Aprovar</button>
            <button onClick={() => rejectComment(c.id)}>Rejeitar</button>
          </div>
        </div>
      ))}
    </Layout>
  );
}
