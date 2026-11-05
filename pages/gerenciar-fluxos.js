
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
  const [etapas, setEtapas] = useState([]);

  // Dados do fluxo
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [codigoErro, setCodigoErro] = useState('');
  const [palavrasChave, setPalavrasChave] = useState('');

  const [editando, setEditando] = useState(null);
  const [fluxoExpandido, setFluxoExpandido] = useState(null);

  // Dados das orientações
  const [tituloEtapa, setTituloEtapa] = useState('');
  const [conteudoEtapa, setConteudoEtapa] = useState('');
  const [ordemEtapa, setOrdemEtapa] = useState(1);
  const [etapaEditando, setEtapaEditando] = useState(null);

  useEffect(() => {
    verificarUsuario();
  }, []);

  async function verificarUsuario() {
    const { data: auth, error } = await supabase.auth.getUser();

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
    setLoading(false);
  }

  // CARREGAR FLUXOS
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

  // CARREGAR ORIENTAÇÕES
  async function carregarEtapas(fluxoId) {
    const { data, error } = await supabase
      .from('aux_etapas')
      .select('*')
      .eq('fluxo_id', fluxoId)
      .order('ordem', { ascending: true });

    if (error) {
      alert('Erro ao carregar orientações: ' + error.message);
      return;
    }

    setEtapas(data || []);
  }

  // LIMPAR FORMULÁRIO DO FLUXO
  function limparFormulario() {
    setNome('');
    setDescricao('');
    setCodigoErro('');
    setPalavrasChave('');
    setEditando(null);
  }

  // LIMPAR FORMULÁRIO DA ORIENTAÇÃO
  function limparFormularioEtapa() {
    setTituloEtapa('');
    setConteudoEtapa('');
    setOrdemEtapa(etapas.length + 1);
    setEtapaEditando(null);
  }

  // CADASTRAR OU EDITAR FLUXO
  async function salvarFluxo() {
    if (!nome.trim()) {
      alert('Informe o nome do problema.');
      return;
    }

    if (!user) return;

    setSalvando(true);

    try {
      const dados = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        codigo_erro: codigoErro.trim(),
        palavras_chave: palavrasChave.trim(),
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
            categoria: 'eletronico',
            criado_por: user.id,
            ativo: true,
            publicado: false
          });
      }

      if (resultado.error) throw resultado.error;

      alert(editando ? 'Fluxo atualizado!' : 'Fluxo criado!');

      limparFormulario();
      await carregarFluxos();

    } catch (error) {
      alert('Erro ao salvar fluxo: ' + error.message);
    } finally {
      setSalvando(false);
    }
  }

  // EDITAR FLUXO
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

  // ABRIR GERENCIAMENTO DE ORIENTAÇÕES
async function abrirGerenciamento(fluxo) {
  setFluxoExpandido(fluxo.id);
  setEtapaEditando(null);

  setTituloEtapa('');
  setConteudoEtapa('');

  const { data, error } = await supabase
    .from('aux_etapas')
    .select('*')
    .eq('fluxo_id', fluxo.id)
    .order('ordem', { ascending: true });

  if (error) {
    alert('Erro ao carregar orientações: ' + error.message);
    return;
  }

  const lista = data || [];

  setEtapas(lista);
  setOrdemEtapa(lista.length + 1);
}

  // SALVAR ORIENTAÇÃO
  async function salvarEtapa(fluxoId) {
    if (!tituloEtapa.trim()) {
      alert('Informe o título da orientação.');
      return;
    }

    if (!conteudoEtapa.trim()) {
      alert('Informe o procedimento que deverá ser realizado.');
      return;
    }

    setSalvando(true);

    try {
      const dados = {
        fluxo_id: fluxoId,
        titulo: tituloEtapa.trim(),
        conteudo: conteudoEtapa.trim(),
        tipo: 'tratativa',
        ordem: Number(ordemEtapa),
        etapa_inicial: Number(ordemEtapa) === 1,
        updated_at: new Date().toISOString()
      };

      let resultado;

      if (etapaEditando) {
        resultado = await supabase
          .from('aux_etapas')
          .update(dados)
          .eq('id', etapaEditando);
      } else {
        resultado = await supabase
          .from('aux_etapas')
          .insert(dados);
      }

      if (resultado.error) throw resultado.error;

      alert('Orientação salva com sucesso!');

      limparFormularioEtapa();

      await carregarEtapas(fluxoId);

    } catch (error) {
      alert('Erro ao salvar orientação: ' + error.message);
    } finally {
      setSalvando(false);
    }
  }

  // EDITAR ORIENTAÇÃO
  function editarEtapa(etapa) {
    setEtapaEditando(etapa.id);
    setTituloEtapa(etapa.titulo || '');
    setConteudoEtapa(etapa.conteudo || '');
    setOrdemEtapa(etapa.ordem || 1);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // EXCLUIR ORIENTAÇÃO
  async function excluirEtapa(etapa, fluxoId) {
    const confirmar = confirm(
      `Deseja excluir a orientação "${etapa.titulo}"?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from('aux_etapas')
      .delete()
      .eq('id', etapa.id);

    if (error) {
      alert('Erro ao excluir: ' + error.message);
      return;
    }

    if (etapaEditando === etapa.id) {
      limparFormularioEtapa();
    }

    alert('Orientação excluída!');

    await carregarEtapas(fluxoId);
  }

  // ALTERAR STATUS
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

  // PUBLICAR OU RETIRAR PUBLICAÇÃO
  async function alterarPublicacao(fluxo) {
    if (!fluxo.publicado) {
      const { data: lista, error } = await supabase
        .from('aux_etapas')
        .select('id, ordem, etapa_inicial')
        .eq('fluxo_id', fluxo.id)
        .order('ordem');

      if (error) {
        alert(error.message);
        return;
      }

      if (!lista?.length) {
        alert('Cadastre pelo menos uma orientação antes de publicar.');
        return;
      }

      if (lista.filter(e => e.ordem === 1).length !== 1) {
        alert('O fluxo precisa ter exatamente uma orientação de ordem 1.');
        return;
      }
    }

    const novoStatus = !fluxo.publicado;

    const { error } = await supabase
      .from('aux_fluxos')
      .update({
        publicado: novoStatus,
        publicado_por: novoStatus ? user.id : null,
        publicado_em: novoStatus ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
        atualizado_por: user.id
      })
      .eq('id', fluxo.id);

    if (error) {
      alert('Erro ao alterar publicação: ' + error.message);
      return;
    }

    alert(novoStatus ? 'Fluxo publicado!' : 'Publicação removida!');

    await carregarFluxos();
  }

  // EXCLUIR FLUXO
  async function excluirFluxo(fluxo) {
    const confirmar = confirm(
      `Deseja excluir o fluxo "${fluxo.nome}" e todas as suas orientações?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from('aux_fluxos')
      .delete()
      .eq('id', fluxo.id);

    if (error) {
      alert('Erro ao excluir fluxo: ' + error.message);
      return;
    }

    if (fluxoExpandido === fluxo.id) {
      setFluxoExpandido(null);
      setEtapas([]);
    }

    alert('Fluxo excluído!');

    await carregarFluxos();
  }

  if (loading) {
    return (
      <Layout>
        <p style={{ color: '#fff' }}>Carregando...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>

        <h1 style={styles.heading}>🔧 Gerenciar Fluxos</h1>

        <p style={styles.subtitle}>
          Cadastre problemas e seus respectivos procedimentos técnicos.
        </p>

        {/* CADASTRO DO FLUXO */}

        <div style={styles.card}>

          <h2 style={styles.sectionTitle}>
            {editando ? 'Editar problema' : 'Cadastrar novo problema'}
          </h2>

          <label style={styles.label}>Nome do problema</label>

          <input
            style={styles.input}
            placeholder="Ex: Bomba não liga"
            value={nome}
            onChange={e => setNome(e.target.value)}
          />

          <label style={styles.label}>Código do erro</label>

          <input
            style={styles.input}
            placeholder="Ex: E001"
            value={codigoErro}
            onChange={e => setCodigoErro(e.target.value)}
          />

          <label style={styles.label}>Palavras-chave para busca</label>

          <input
            style={styles.input}
            placeholder="Ex: bomba, motor, não liga, disjuntor"
            value={palavrasChave}
            onChange={e => setPalavrasChave(e.target.value)}
          />

          <p style={styles.hint}>
            Separe as palavras-chave por vírgula. Elas ajudarão o analista a encontrar o procedimento.
          </p>

          <label style={styles.label}>Descrição do problema</label>

          <textarea
            style={styles.input}
            rows={4}
            placeholder="Descreva quando este procedimento deverá ser utilizado..."
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
                  : 'Cadastrar problema'}
            </button>

            {editando && (
              <button
                style={styles.secondaryButton}
                onClick={limparFormulario}
              >
                Cancelar edição
              </button>
            )}

          </div>

        </div>

        {/* LISTA DE FLUXOS */}

        <h2 style={styles.sectionTitle}>
          Problemas cadastrados ({fluxos.length})
        </h2>

        {fluxos.length === 0 && (
          <div style={styles.card}>
            Nenhum problema cadastrado.
          </div>
        )}

        {fluxos.map(fluxo => (

          <div key={fluxo.id} style={styles.card}>

            <div style={styles.header}>

              <h3 style={styles.flowTitle}>
                🔧 {fluxo.nome}
              </h3>

              <span style={{
                color: fluxo.publicado ? '#4CAF50' : '#FFD600',
                fontWeight: 'bold',
                fontSize: 12
              }}>
                {fluxo.publicado ? 'PUBLICADO' : 'RASCUNHO'}
              </span>

            </div>

            <p style={styles.description}>
              {fluxo.descricao || 'Sem descrição.'}
            </p>

            {fluxo.codigo_erro && (
              <p style={styles.metadata}>
                Código: {fluxo.codigo_erro}
              </p>
            )}

            {fluxo.palavras_chave && (
              <p style={styles.metadata}>
                Palavras-chave: {fluxo.palavras_chave}
              </p>
            )}

            <p style={styles.metadata}>
              Status: {fluxo.ativo ? 'Ativo' : 'Inativo'}
            </p>

            <div style={styles.actions}>

              <button
                style={styles.mainButton}
                onClick={() => editarFluxo(fluxo)}
              >
                ✏️ Editar problema
              </button>

              <button
                style={styles.secondaryButton}
                onClick={() => abrirGerenciamento(fluxo)}
              >
                📋 Gerenciar orientações
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
                {fluxo.publicado ? 'Retirar publicação' : 'Publicar'}
              </button>

              <button
                style={styles.deleteButton}
                onClick={() => excluirFluxo(fluxo)}
              >
                🗑️ Excluir
              </button>

            </div>

            {/* ÁREA DE ORIENTAÇÕES */}

            {fluxoExpandido === fluxo.id && (

              <div style={styles.stepsArea}>

                <h2 style={styles.sectionTitle}>
                  Passo a passo: {fluxo.nome}
                </h2>

                <p style={styles.description}>
                  Cadastre cada procedimento que o analista deverá realizar.
                </p>

                <label style={styles.label}>
                  Nome da orientação
                </label>

                <input
                  style={styles.input}
                  placeholder="Ex: Verificar o disjuntor"
                  value={tituloEtapa}
                  onChange={e => setTituloEtapa(e.target.value)}
                />

                <label style={styles.label}>
                  Instruções do procedimento
                </label>

                <textarea
                  style={styles.input}
                  rows={5}
                  placeholder="Descreva detalhadamente o que o analista deverá verificar ou executar..."
                  value={conteudoEtapa}
                  onChange={e => setConteudoEtapa(e.target.value)}
                />

                <label style={styles.label}>
                  Ordem de execução
                </label>

                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  value={ordemEtapa}
                  onChange={e => setOrdemEtapa(e.target.value)}
                />

                <div style={styles.actions}>

                  <button
                    style={styles.mainButton}
                    disabled={salvando}
                    onClick={() => salvarEtapa(fluxo.id)}
                  >
                    {salvando
                      ? 'Salvando...'
                      : etapaEditando
                        ? 'Salvar orientação'
                        : 'Adicionar orientação'}
                  </button>

                  {etapaEditando && (
                    <button
                      style={styles.secondaryButton}
                      onClick={limparFormularioEtapa}
                    >
                      Cancelar edição
                    </button>
                  )}

                </div>

                <h3 style={styles.sectionTitle}>
                  Orientações cadastradas ({etapas.length})
                </h3>

                {etapas.length === 0 && (
                  <p style={styles.description}>
                    Nenhuma orientação cadastrada ainda.
                  </p>
                )}

                {etapas.map(etapa => (

                  <div key={etapa.id} style={styles.stepCard}>

                    <h3 style={styles.flowTitle}>
                      {etapa.ordem}. {etapa.titulo}
                    </h3>

                    <p style={styles.description}>
                      {etapa.conteudo}
                    </p>

                    <p style={styles.hint}>
                      Ao finalizar este passo, o analista poderá informar se o problema foi resolvido.
                    </p>

                    <div style={styles.actions}>

                      <button
                        style={styles.mainButton}
                        onClick={() => editarEtapa(etapa)}
                      >
                        ✏️ Editar
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() => excluirEtapa(etapa, fluxo.id)}
                      >
                        🗑️ Excluir
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}

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
    marginBottom: 8,
    fontSize: 28
  },

  subtitle: {
    color: '#aaa',
    marginBottom: 25
  },

  sectionTitle: {
    color: '#FFD600',
    marginTop: 22,
    marginBottom: 15
  },

  card: {
    background: '#111',
    border: '1px solid #333',
    borderRadius: 14,
    padding: 20,
    marginBottom: 18
  },

  stepsArea: {
    background: '#0b0b0b',
    border: '1px solid #555',
    borderRadius: 12,
    padding: 20,
    marginTop: 22
  },

  stepCard: {
    background: '#1a1a1a',
    border: '1px solid #444',
    borderRadius: 10,
    padding: 16,
    marginTop: 14
  },

  label: {
    display: 'block',
    marginTop: 15,
    marginBottom: 7,
    color: '#ddd',
    fontWeight: 'bold'
  },

  input: {
    width: '100%',
    padding: 12,
    background: '#0b0b0b',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: 8,
    marginBottom: 5,
    fontSize: 14,
    boxSizing: 'border-box'
  },

  hint: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
    lineHeight: 1.5
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
    cursor: 'pointer',
    fontWeight: 'bold'
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

  description: {
    color: '#ccc',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.6
  },

  metadata: {
    color: '#888',
    fontSize: 12,
    marginTop: 8
  }
};
