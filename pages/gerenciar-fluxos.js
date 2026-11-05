
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function GerenciarFluxos() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [fluxos, setFluxos] = useState([]);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [codigoErro, setCodigoErro] = useState('');
  const [palavrasChave, setPalavrasChave] = useState('');

  const [editando, setEditando] = useState(null);

  useEffect(() => {
    verificarUsuario();
  }, []);

  async function verificarUsuario() {
    try {
      const { data: auth, error } =
        await supabase.auth.getUser();

      if (error || !auth?.user) {
        router.replace('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', auth.user.id)
        .maybeSingle();

      const role = profile?.role?.toLowerCase();

      if (role !== 'admin' && role !== 'supervisor') {
        alert('Você não tem permissão para acessar esta página.');
        router.replace('/base');
        return;
      }

      setUser({
        id: auth.user.id,
        role
      });

      await carregarFluxos();

    } catch (error) {
      alert('Erro ao verificar usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function carregarFluxos() {
    const { data, error } = await supabase
      .from('aux_fluxos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      alert('Erro ao carregar fluxos: ' + error.message);
      return;
    }

    setFluxos(data || []);
  }

  function limparFormulario() {
    setNome('');
    setDescricao('');
    setCodigoErro('');
    setPalavrasChave('');
    setEditando(null);
  }

  async function salvarFluxo() {
    if (!nome.trim()) {
      alert('Informe o nome do fluxo.');
      return;
    }

    if (!user) return;

    setSalvando(true);

    try {
      const dados = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        codigo_erro: codigoErro.trim() || null,
        palavras_chave: palavrasChave.trim() || null,
        atualizado_por: user.id,
        updated_at: new Date().toISOString()
      };

      let resultado;

      if (editando) {
        resultado = await supabase
          .from('aux_fluxos')
          .update(dados)
          .eq('id', editando);
      } else {
        resultado = await supabase
          .from('aux_fluxos')
          .insert({
            ...dados,
            criado_por: user.id,
            ativo: true,
            publicado: false
          });
      }

      if (resultado.error) {
        throw resultado.error;
      }

      alert(editando ? 'Fluxo atualizado!' : 'Fluxo criado!');

      limparFormulario();
      await carregarFluxos();

    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSalvando(false);
    }
  }

  function editarFluxo(fluxo) {
    setEditando(fluxo.id);

    setNome(fluxo.nome || '');
    setDescricao(fluxo.descricao || '');
    setCodigoErro(fluxo.codigo_erro || '');
    setPalavrasChave(fluxo.palavras_chave || '');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  async function alterarStatus(fluxo) {
    const { error } = await supabase
      .from('aux_fluxos')
      .update({
        ativo: !fluxo.ativo,
        updated_at: new Date().toISOString(),
        atualizado_por: user.id
      })
      .eq('id', fluxo.id);

    if (error) {
      alert(error.message);
      return;
    }

    await carregarFluxos();
  }

  async function alterarPublicacao(fluxo) {
    if (!fluxo.publicado) {
      const { data: etapas, error: etapasError } =
        await supabase
          .from('aux_etapas')
          .select('id, etapa_inicial')
          .eq('fluxo_id', fluxo.id);

      if (etapasError) {
        alert(etapasError.message);
        return;
      }

      if (!etapas?.length) {
        alert('Adicione pelo menos uma etapa antes de publicar.');
        return;
      }

      if (etapas.filter(e => e.etapa_inicial).length !== 1) {
        alert('O fluxo precisa ter exatamente uma etapa inicial.');
        return;
      }
    }

    const novoStatus = !fluxo.publicado;

    const { error } = await supabase
      .from('aux_fluxos')
      .update({
        publicado: novoStatus,
        publicado_por: novoStatus ? user.id : null,
        publicado_em: novoStatus
          ? new Date().toISOString()
          : null,
        updated_at: new Date().toISOString(),
        atualizado_por: user.id
      })
      .eq('id', fluxo.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert(novoStatus ? 'Fluxo publicado!' : 'Publicação removida!');

    await carregarFluxos();
  }

  async function excluirFluxo(fluxo) {
    const confirmar = confirm(
      `Deseja excluir o fluxo "${fluxo.nome}"?\n\nTodas as etapas e opções relacionadas também serão excluídas.`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from('aux_fluxos')
      .delete()
      .eq('id', fluxo.id);

    if (error) {
      alert('Erro ao excluir: ' + error.message);
      return;
    }

    alert('Fluxo excluído!');

    if (editando === fluxo.id) {
      limparFormulario();
    }

    await carregarFluxos();
  }

  if (loading) {
    return (
      <Layout>
        <p style={styles.text}>Carregando...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>

        <h1 style={styles.heading}>
          🔧 Gerenciar Fluxos
        </h1>

        <p style={styles.subtitle}>
          Cadastre e gerencie os procedimentos de auxílio técnico.
        </p>

        <div style={styles.card}>

          <h2 style={styles.sectionTitle}>
            {editando ? 'Editar Fluxo' : 'Novo Fluxo'}
          </h2>

          <label style={styles.label}>
            Nome do fluxo
          </label>

          <input
            style={styles.input}
            placeholder="Ex: Bomba não liga"
            value={nome}
            onChange={e => setNome(e.target.value)}
          />

          <label style={styles.label}>
            Código do erro
          </label>

          <input
            style={styles.input}
            placeholder="Ex: E1025"
            value={codigoErro}
            onChange={e => setCodigoErro(e.target.value)}
          />

          <label style={styles.label}>
            Palavras-chave para pesquisa
          </label>

          <textarea
            style={styles.input}
            rows={3}
            placeholder="Ex: bomba parada, motor não liga, falha de acionamento..."
            value={palavrasChave}
            onChange={e => setPalavrasChave(e.target.value)}
          />

          <p style={styles.hint}>
            Separe os termos por vírgula. Eles ajudarão os técnicos
            a encontrar este procedimento na busca.
          </p>

          <label style={styles.label}>
            Descrição
          </label>

          <textarea
            style={styles.input}
            rows={4}
            placeholder="Descreva o objetivo deste fluxo..."
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
          />

          <div style={styles.actions}>

            <button
              style={styles.mainButton}
              onClick={salvarFluxo}
              disabled={salvando}
            >
              {salvando
                ? 'Salvando...'
                : editando
                  ? 'Salvar alterações'
                  : 'Criar fluxo'}
            </button>

            {editando && (
              <button
                style={styles.secondaryButton}
                onClick={limparFormulario}
              >
                Cancelar
              </button>
            )}

          </div>

        </div>

        <h2 style={styles.sectionTitle}>
          Fluxos cadastrados ({fluxos.length})
        </h2>

        {fluxos.length === 0 && (
          <div style={styles.card}>
            Nenhum fluxo cadastrado ainda.
          </div>
        )}

        {fluxos.map(fluxo => (

          <div key={fluxo.id} style={styles.card}>

            <div style={styles.header}>

              <h3 style={styles.flowTitle}>
                🔧 {fluxo.nome}
              </h3>

              <span style={{
                ...styles.badge,
                color: fluxo.publicado ? '#4CAF50' : '#FFD600'
              }}>
                {fluxo.publicado ? 'PUBLICADO' : 'RASCUNHO'}
              </span>

            </div>

            <p style={styles.description}>
              {fluxo.descricao || 'Sem descrição.'}
            </p>

            <p style={styles.metadata}>
              Código: {fluxo.codigo_erro || 'Não informado'}
            </p>

            <p style={styles.metadata}>
              Palavras-chave: {fluxo.palavras_chave || 'Não informadas'}
            </p>

            <p style={styles.metadata}>
              Status: {fluxo.ativo ? 'Ativo' : 'Inativo'}
            </p>

            <div style={styles.actions}>

              <button
                style={styles.mainButton}
                onClick={() => editarFluxo(fluxo)}
              >
                ✏️ Editar
              </button>

              <button
                style={styles.secondaryButton}
                onClick={() => router.push(
                  `/editar-etapas?fluxo=${fluxo.id}`
                )}
              >
                📋 Gerenciar etapas
              </button>

              <button
                style={styles.secondaryButton}
                onClick={() => alterarStatus(fluxo)}
              >
                {fluxo.ativo ? 'Desativar' : 'Ativar'}
              </button>

              <button
                style={styles.secondaryButton}
                onClick={() => alterarPublicacao(fluxo)}
              >
                {fluxo.publicado
                  ? 'Retirar publicação'
                  : 'Publicar'}
              </button>

              <button
                style={styles.deleteButton}
                onClick={() => excluirFluxo(fluxo)}
              >
                🗑️ Excluir
              </button>

            </div>

          </div>

        ))}

      </div>
    </Layout>
  );
}

const styles = {

  container: {
    width: '100%',
    maxWidth: 1100,
    margin: '0 auto',
    color: '#fff'
  },

  heading: {
    color: '#FFD600',
    marginBottom: 8
  },

  subtitle: {
    color: '#aaa',
    marginBottom: 25
  },

  sectionTitle: {
    color: '#FFD600',
    marginTop: 25,
    marginBottom: 15
  },

  card: {
    background: '#111',
    border: '1px solid #333',
    borderRadius: 14,
    padding: 20,
    marginBottom: 18
  },

  label: {
    display: 'block',
    marginTop: 15,
    marginBottom: 7,
    color: '#ddd'
  },

  input: {
    width: '100%',
    padding: 12,
    background: '#0b0b0b',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: 8,
    marginBottom: 5
  },

  hint: {
    color: '#888',
    fontSize: 12,
    marginTop: 4
  },

  actions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 18
  },

  mainButton: {
    background: '#FFD600',
    color: '#000',
    border: 'none',
    padding: '11px 16px',
    borderRadius: 8,
    cursor: 'pointer'
  },

  secondaryButton: {
    background: 'transparent',
    color: '#FFD600',
    border: '1px solid #FFD600',
    padding: '10px 14px',
    borderRadius: 8,
    cursor: 'pointer'
  },

  deleteButton: {
    background: 'transparent',
    color: '#ff5555',
    border: '1px solid #ff5555',
    padding: '10px 14px',
    borderRadius: 8,
    cursor: 'pointer'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap'
  },

  flowTitle: {
    margin: 0,
    color: '#fff'
  },

  badge: {
    fontSize: 12,
    fontWeight: 'bold'
  },

  description: {
    color: '#ccc',
    whiteSpace: 'pre-wrap'
  },

  metadata: {
    color: '#888',
    fontSize: 12
  },

  text: {
    color: '#fff'
  }

};
