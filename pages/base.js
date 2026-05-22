import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';
import useUser from '../lib/useUser';

export default function Base() {
  const user = useUser();

  const [topics, setTopics] = useState([]);
  const [comments, setComments] = useState([]);

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: t } = await supabase.from('topicos').select('*');
    const { data: c } = await supabase.from('comentarios').select('*');

    setTopics(t || []);
    setComments(c || []);
  }

  async function createTopic() {
    await supabase.from('topicos').insert([
      {
        titulo: title,
        user_id: user.id,
        status: 'pending'
      }
    ]);

    load();
  }

  async function createComment(id) {
    await supabase.from('comentarios').insert([
      {
        texto,
        topico_id: id,
        user_id: user.id,
        status: 'pending'
      }
    ]);

    load();
  }

  return (
    <ProtectedRoute>
      <Layout>

        <h1 style={{ color: '#f5c400' }}>Base de Conhecimento</h1>

        <input placeholder="Novo tópico" onChange={e => setTitle(e.target.value)} />
        <button onClick={createTopic}>Criar</button>

        {topics.map(t => (
          <div key={t.id} style={{ marginTop: 20 }}>

            <h3>{t.titulo}</h3>

            <input placeholder="comentário" onChange={e => setText(e.target.value)} />
            <button onClick={() => createComment(t.id)}>Enviar</button>

            {comments.filter(c => c.topico_id === t.id).map(c => (
              <p key={c.id}>{c.texto}</p>
            ))}

          </div>
        ))}

      </Layout>
    </ProtectedRoute>
  );
}
