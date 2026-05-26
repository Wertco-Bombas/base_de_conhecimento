import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Approval() {
  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    load();
  }, []);

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
    await supabase
      .from('topicos')
      .update({ status: 'approved' })
      .eq('id', id);

    load();
  }

  async function rejectTopic(id) {
    await supabase
      .from('topicos')
      .update({ status: 'rejected' })
      .eq('id', id);

    load();
  }

  async function approveComment(id) {
    await supabase
      .from('comentarios')
      .update({ status: 'approved' })
      .eq('id', id);

    load();
  }

  async function rejectComment(id) {
    await supabase
      .from('comentarios')
      .update({ status: 'rejected' })
      .eq('id', id);

    load();
  }

  return (
    <Layout>
      <h1 style={{ color: '#FFD600' }}>Aprovação</h1>

      <h2 style={{ color: '#fff' }}>Tópicos pendentes</h2>

      {topics.map(t => (
        <div key={t.id} style={{ padding: 10, border: '1px solid #333', marginBottom: 10, color: '#fff' }}>
          <h3>{t.titulo}</h3>
          <p>{t.descricao}</p>

          <button onClick={() => approveTopic(t.id)}>Aprovar</button>
          <button onClick={() => rejectTopic(t.id)}>Rejeitar</button>
        </div>
      ))}

      <h2 style={{ color: '#fff' }}>Comentários pendentes</h2>

      {comments.map(c => (
        <div key={c.id} style={{ padding: 10, border: '1px solid #333', marginBottom: 10, color: '#fff' }}>
          <p>{c.texto}</p>

          <button onClick={() => approveComment(c.id)}>Aprovar</button>
          <button onClick={() => rejectComment(c.id)}>Rejeitar</button>
        </div>
      ))}
    </Layout>
  );
}
