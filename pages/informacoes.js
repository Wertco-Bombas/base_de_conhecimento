import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Informacoes() {
  const [user, setUser] = useState(null);
  const [infos, setInfos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');

  useEffect(() => {
    async function init() {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      if (!currentUser) return setUser(null);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', currentUser.id)
        .maybeSingle();

      setUser({
        id: currentUser.id,
        email: currentUser.email,
        role: profile?.role || 'user'
      });

      loadInfos();
    }

    init();
  }, []);

  async function loadInfos() {
    const { data, error } = await supabase
      .from('informacoes_importantes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return console.error(error);

    setInfos(data || []);
    setLoading(false);
  }

  async function salvar() {
    if (!titulo.trim() || !conteudo.trim()) return alert('Preencha todos os campos');

    const { data, error } = await supabase
      .from('informacoes_importantes')
      .insert({
        titulo,
        conteudo,
        created_by: user?.email
      })
      .select();

    if (error) return alert(error.message);

    setInfos(prev => [data[0], ...prev]);
    setTitulo('');
    setConteudo('');
    setShowModal(false);
  }

  return (
    <Layout>
      <h1 style={{ color: '#FFD600' }}>Informações Importantes</h1>

      {user?.role === 'admin' || user?.role === 'supervisor' ? (
        <button
          style={{
            ...styles.mainBtn,
            marginBottom: 20
          }}
          onClick={() => setShowModal(true)}
        >
          + Nova Informação
        </button>
      ) : null}

      {loading ? (
        <p>Carregando...</p>
      ) : infos.length === 0 ? (
        <p>Nenhuma informação disponível.</p>
      ) : (
        infos.map(info => (
          <div key={info.id} style={styles.card}>
            <h3 style={{ margin: 0 }}>{info.titulo}</h3>
            <p style={{ whiteSpace: 'pre-line' }}>{info.conteudo}</p>
            <small style={{ color: '#888' }}>Criado por: {info.created_by}</small>
          </div>
        ))
      )}

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h2 style={{ color: '#FFD600' }}>Nova Informação</h2>

            <input
              style={styles.input}
              placeholder="Título"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
            />

            <textarea
              style={{ ...styles.input, height: 120 }}
              placeholder="Conteúdo"
              value={conteudo}
              onChange={e => setConteudo(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button style={styles.mainBtn} onClick={salvar}>Salvar</button>
              <button style={styles.smallBtn} onClick={() => setShowModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const styles = {
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    color: '#fff'
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

  input: {
    width: '100%',
    background: '#0b0b0b',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    marginBottom: 10,
    fontSize: 14,
    minWidth: 0
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
    maxWidth: 500,
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  }
};
