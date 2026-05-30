import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Informacoes() {
  const [user, setUser] = useState(null);
  const [infos, setInfos] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();

    if (auth?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', auth.user.id)
        .maybeSingle();

      setUser({
        email: auth.user.email,
        role: profile?.role
      });
    }

    const { data } = await supabase
      .from('informacoes_importantes')
      .select('*')
      .order('id', { ascending: false });

    setInfos(data || []);
  }

  async function salvar() {
    await supabase
      .from('informacoes_importantes')
      .insert({
        titulo,
        conteudo,
        created_by: user?.email
      });

    setTitulo('');
    setConteudo('');
    setShowModal(false);

    load();
  }

  async function excluir(id) {
    if (!confirm('Excluir informação?')) return;

    await supabase
      .from('informacoes_importantes')
      .delete()
      .eq('id', id);

    load();
  }

  return (
    <Layout>

      <h1 style={{ color: '#FFD600' }}>
        📢 Informações Importantes
      </h1>

      {(user?.role === 'admin' ||
        user?.role === 'supervisor') && (
        <button
          style={styles.mainBtn}
          onClick={() => setShowModal(true)}
        >
          + Nova Informação
        </button>
      )}

      {infos.map(info => (
        <div
          key={info.id}
          style={styles.card}
        >
          <h2>{info.titulo}</h2>

          <p style={{ whiteSpace: 'pre-line' }}>
            {info.conteudo}
          </p>

          <small style={{ color: '#888' }}>
            {info.created_by}
          </small>

          {(user?.role === 'admin' ||
            user?.role === 'supervisor') && (
            <div style={{ marginTop: 10 }}>
              <button
                style={styles.deleteBtn}
                onClick={() => excluir(info.id)}
              >
                Excluir
              </button>
            </div>
          )}
        </div>
      ))}

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalBox}>
            <h2>Nova Informação</h2>

            <input
              placeholder="Título"
              value={titulo}
              onChange={(e) =>
                setTitulo(e.target.value)
              }
              style={styles.input}
            />

            <textarea
              rows={6}
              placeholder="Conteúdo"
              value={conteudo}
              onChange={(e) =>
                setConteudo(e.target.value)
              }
              style={styles.input}
            />

            <div style={{
              display:'flex',
              gap:10
            }}>
              <button
                style={styles.mainBtn}
                onClick={salvar}
              >
                Salvar
              </button>

              <button
                style={styles.smallBtn}
                onClick={() =>
                  setShowModal(false)
                }
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}

const styles = {
  card: {
    background:'#111',
    border:'1px solid #222',
    borderRadius:16,
    padding:20,
    marginTop:15
  },

  input: {
    width:'100%',
    padding:12,
    borderRadius:12,
    border:'1px solid #333',
    background:'#0b0b0b',
    color:'#fff',
    marginBottom:10
  },

  mainBtn: {
    background:'#FFD600',
    color:'#000',
    border:'none',
    padding:'12px 18px',
    borderRadius:12,
    cursor:'pointer'
  },

  smallBtn: {
    background:'transparent',
    border:'1px solid #FFD600',
    color:'#FFD600',
    padding:'12px 18px',
    borderRadius:12,
    cursor:'pointer'
  },

  deleteBtn: {
    background:'#ff4d4d',
    color:'#fff',
    border:'none',
    padding:'8px 12px',
    borderRadius:10,
    cursor:'pointer'
  },

  modal: {
    position:'fixed',
    inset:0,
    background:'rgba(0,0,0,.85)',
    display:'flex',
    justifyContent:'center',
    alignItems:'center'
  },

  modalBox: {
    width:'90%',
    maxWidth:600,
    background:'#111',
    padding:25,
    borderRadius:18,
    border:'1px solid #FFD600'
  }
};
