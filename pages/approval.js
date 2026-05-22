import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { logAction } from '../lib/audit';

export default function Approval() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from('topicos')
      .select('*')
      .eq('status', 'pending');

    const { data: comments } = await supabase
      .from('comentarios')
      .select('*')
      .eq('status', 'pending');

    const merged = [
      ...(data || []).map(i => ({ ...i, type: 'topic' })),
      ...(comments || []).map(i => ({ ...i, type: 'comment' }))
    ];

    setItems(merged);
  }

  async function approve(item, type) {
    await supabase
      .from(type === 'topic' ? 'topicos' : 'comentarios')
      .update({ status: 'approved' })
      .eq('id', item.id);

    await log('APPROVE', null, type, item.id);
    load();
  }

  async function reject(item, type) {
    await supabase
      .from(type === 'topic' ? 'topicos' : 'comentarios')
      .update({ status: 'rejected' })
      .eq('id', item.id);

    await log('REJECT', null, type, item.id);
    load();
  }

  return (
    <Layout>
      <div style={{ padding: 20, color: '#fff' }}>

        <h1 style={{ color: '#f5c400' }}>Inbox de Aprovação</h1>

        {items.map((item) => (
          <div key={item.id} style={styles.card}>

            <p style={{ color: '#f5c400' }}>
              {item.type.toUpperCase()}
            </p>

            <p>{item.titulo || item.texto}</p>

            <button onClick={() => approve(item, item.type)}>
              Aprovar
            </button>

            <button onClick={() => reject(item, item.type)}>
              Rejeitar
            </button>

          </div>
        ))}

      </div>
    </Layout>
  );
}

const styles = {
  card: {
    background: '#111',
    padding: 10,
    marginTop: 10,
    borderRadius: 8
  }
};
