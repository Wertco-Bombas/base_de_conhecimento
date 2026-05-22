import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function KnowledgeSearch() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);

  async function search(value) {
    setQ(value);

    if (!value) {
      setResults([]);
      return;
    }

    const { data } = await supabase
      .from('topicos')
      .select('*')
      .ilike('titulo', `%${value}%`);

    setResults(data || []);
  }

  return (
    <div style={styles.box}>

      <input
        value={q}
        onChange={(e) => search(e.target.value)}
        placeholder="Buscar na base de conhecimento..."
        style={styles.input}
      />

      {results.map((item) => (
        <div key={item.id} style={styles.result}>
          {item.titulo}
        </div>
      ))}

    </div>
  );
}

const styles = {
  box: {
    marginBottom: 20
  },

  input: {
    width: '100%',
    padding: 10,
    background: '#111',
    border: '1px solid #333',
    color: '#fff',
    borderRadius: 8
  },

  result: {
    padding: 10,
    marginTop: 5,
    background: '#1a1a1a',
    borderRadius: 8,
    color: '#f5c400'
  }
};
