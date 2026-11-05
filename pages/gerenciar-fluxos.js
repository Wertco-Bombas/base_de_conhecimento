
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

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [codigoErro, setCodigoErro] = useState('');
  const [palavrasChave, setPalavrasChave] = useState('');

  const [editando, setEditando] = useState(null);
  const [fluxoExpandido, setFluxoExpandido] = useState(null);

  const [tituloEtapa, setTituloEtapa] = useState('');
  const [conteudoEtapa, setConteudoEtapa] = useState('');
  const [tipoEtapa, setTipoEtapa] = useState('pergunta');
  const [etapaInicial, setEtapaInicial] = useState(false);
  const [ordemEtapa, setOrdemEtapa] = useState(1);
  const [etapaEditando, setEtapaEditando] = useState(null);

  const [opcoes, setOpcoes] = useState([
    { texto: 'Sim', proxima_etapa_id: '' },
    { texto: 'Não', proxima_etapa_id: '' }
  ]);

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

  async function carregarEtapas(fluxoId) {
    const { data, error } = await supabase
      .from('aux_etapas')
      .select('*')
      .eq('fluxo_id', fluxoId)
      .order('ordem');

    if (error) {
      alert('Erro ao carregar etapas: ' + error.message);
      return;
    }

    const lista = await Promise.all(
      (data || []).map(async etapa => {
        const { data: opcoesData } = await supabase
          .from('aux_opcoes')
          .select('*')
          .eq('etapa_id', etapa.id)
          .order('ordem');

        return {
          ...etapa,
          opcoes: opcoesData || []
        };
      })
    );

    setEtapas(lista);
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

  async function abrirGerenciamento(fluxo) {
    setFluxoExpandido(fluxo.id);
    setEtapaEditando(null);

    limparFormularioEtapa();
    await carregarEtapas(fluxo.id);
  }

  function limparFormularioEtapa() {
    setTituloEtapa('');
    setConteudoEtapa('');
    setTipoEtapa('pergunta');
    setEtapaInicial(false);
    setOrdemEtapa(etapas.length + 1);
    setEtapaEditando(null);

    setOpcoes([
      { texto: 'Sim', proxima_etapa_id: '' },
      { texto: 'Não', proxima_etapa_id: '' }
    ]);
  }

  function adicionarOpcao() {
    setOpcoes([
      ...opcoes,
      { texto: '', proxima_etapa_id: '' }
    ]);
  }

  function removerOpcao(index) {
    setOpcoes(opcoes.filter((_, i) => i !== index));
  }

  function atualizarOpcao(index, campo, valor) {
    const novas = [...opcoes];

    novas[index] = {
      ...novas[index],
      [campo]: valor
    };

    setOpcoes(novas);
  }

  async function salvarEtapa(fluxoId) {
    if (!tituloEtapa.trim()) {
      alert('Informe o título da etapa.');
      return;
    }

    if (tipoEtapa === 'pergunta') {
      if (opcoes.length < 2) {
        alert('Cadastre pelo menos duas respostas.');
        return;
      }

      if (opcoes.some(o => !o.texto.trim())) {
        alert('Preencha todas as respostas.');
        return;
      }
    }

    setSalvando(true);

    try {
      const dados = {
        fluxo_id: fluxoId,
        titulo: tituloEtapa.trim(),
        conteudo: conteudoEtapa.trim(),
        tipo: tipoEtapa,
        ordem: Number(ordemEtapa),
        etapa_inicial: etapaInicial,
        updated_at: new Date().toISOString()
      };

      if (etapaInicial) {
        const { error } = await supabase
          .from('aux_etapas')
          .update({ etapa_inicial: false })
          .eq('fluxo_id', fluxoId);

        if (error) throw error;
      }

      let etapaId = etapaEditando;

      if (etapaEditando) {
        const { error } = await supabase
          .from('aux_etapas')
          .update(dados)
          .eq('id', etapaEditando);

        if (error) throw error;

        const { error: excluirError } = await supabase
          .from('aux_opcoes')
          .delete()
          .eq('etapa_id', etapaEditando);

        if (excluirError) throw excluirError;

      } else {
        const { data, error } = await supabase
          .from('aux_etapas')
          .insert(dados)
          .select()
          .single();

        if (error) throw error;

        etapaId = data.id;
      }

      if (tipoEtapa === 'pergunta') {
        const dadosOpcoes = opcoes.map((o, index) => ({
          etapa_id: etapaId,
          texto: o.texto.trim(),
          proxima_etapa_id: o.proxima_etapa_id || null,
          ordem: index + 1
        }));

        const { error } = await supabase
          .from('aux_opcoes')
          .insert(dadosOpcoes);

        if (error) throw error;
      }

      alert('Etapa salva com sucesso!');

      setTituloEtapa('');
      setConteudoEtapa('');
      setTipoEtapa('pergunta');
      setEtapaInicial(false);
      setEtapaEditando(null);
      setOpcoes([
        { texto: 'Sim', proxima_etapa_id: '' },
        { texto: 'Não', proxima_etapa_id: '' }
      ]);

      await carregarEtapas(fluxoId);

    } catch (error) {
      alert('Erro ao salvar etapa: ' + error.message);
    } finally {
      setSalvando(false);
    }
  }

  function editarEtapa(etapa) {
    setEtapaEditando(etapa.id);
    setTituloEtapa(etapa.titulo);
    setConteudoEtapa(etapa.conteudo || '');
    setTipoEtapa(etapa.tipo);
    setEtapaInicial(etapa.etapa_inicial);
    setOrdemEtapa(etapa.ordem);

    setOpcoes(
      etapa.opcoes?.length
        ? etapa.opcoes.map(o => ({
            texto: o.texto,
            proxima_etapa_id: o.proxima_etapa_id || ''
          }))
        : [
            { texto: 'Sim', proxima_etapa_id: '' },
            { texto: 'Não', proxima_etapa_id: '' }
          ]
    );
  }

  async function excluirEtapa(etapa, fluxoId) {
    if (!confirm(`Deseja excluir a etapa "${etapa.titulo}"?`)) {
      return;
    }

    const { error } = await supabase
      .from('aux_etapas')
      .delete()
      .eq('id', etapa.id);

    if (error) {
      alert('Erro ao excluir: ' + error.message);
      return;
    }

    alert('Etapa excluída!');

    await carregarEtapas(fluxoId);
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
      const { data: lista, error } = await supabase
        .from('aux_etapas')
        .select('id, etapa_inicial, tipo')
        .eq('fluxo_id', fluxo.id);

      if (error) {
        alert(error.message);
        return;
      }

      if (!lista?.length) {
        alert('Cadastre pelo menos uma etapa.');
        return;
      }

      if (lista.filter(e => e.etapa_inicial).length !== 1) {
        alert('O fluxo precisa ter exatamente uma etapa inicial.');
        return;
      }

      const ids = lista.map(e => e.id);
      const { data: respostas, error: respostasError } = await supabase
        .from('aux_opcoes')
        .select('etapa_id, texto, proxima_etapa_id')
        .in('etapa_id', ids);

      if (respostasError) {
        alert(respostasError.message);
        return;
      }

      for (const etapa of lista) {
        if (etapa.tipo !== 'pergunta') continue;

        const respostasEtapa = (respostas || []).filter(
          r => r.etapa_id === etapa.id
        );

        if (respostasEtapa.length < 2) {
          alert('Cada pergunta precisa ter pelo menos duas respostas.');
          return;
        }

        if (respostasEtapa.some(r => !r.proxima_etapa_id)) {
          alert('Configure o destino de todas as respostas antes de publicar.');
          return;
        }

        if (respostasEtapa.some(
          r => !ids.includes(r.proxima_etapa_id)
        )) {
          alert('Existe uma resposta direcionando para uma etapa inválida.');
          return;
        }
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
      alert(error.message);
      return;
    }

    alert(novoStatus ? 'Fluxo publicado!' : 'Publicação removida!');

    await carregarFluxos();
  }

  async function excluirFluxo(fluxo) {
    if (!confirm(`Deseja excluir o fluxo "${fluxo.nome}" e todas as suas etapas?`)) {
      return;
    }

    const { error } = await supabase
      .from('aux_fluxos')
      .delete()
      .eq('id', fluxo.id);

    if (error) {
      alert('Erro ao excluir: ' + error.message);
      return;
    }

    alert('Fluxo excluído!');

    if (fluxoExpandido === fluxo.id) {
      setFluxoExpandido(null);
      setEtapas([]);
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

        <h1 style={styles.heading}>🔧 Gerenciar Fluxos</h1>

        <p style={styles.subtitle}>
          Cadastre problemas, códigos de erro, palavras-chave,
          perguntas e orientações técnicas.
        </p>

        {/* CADASTRO DO FLUXO */}

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            {editando ? 'Editar fluxo' : 'Novo fluxo'}
          </h2>

          <label style={styles.label}>Nome do problema</label>
          <input
            style={styles.input}
            placeholder="Ex: Equipamento não liga"
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

          <label style={styles.label}>Palavras-chave</label>
          <input
            style={styles.input}
            placeholder="Ex: bomba, motor, equipamento parado"
            value={palavrasChave}
            onChange={e => setPalavrasChave(e.target.value)}
          />

          <label style={styles.label}>Descrição</label>
          <textarea
            style={styles.input}
            rows={3}
            placeholder="Descreva o problema..."
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

        {/* LISTAGEM DOS FLUXOS */}

        <h2 style={styles.sectionTitle}>
          Fluxos cadastrados ({fluxos.length})
        </h2>

        {fluxos.length === 0 && (
          <div style={styles.card}>
            Nenhum fluxo cadastrado.
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
                onClick={() => {
                  if (fluxoExpandido === fluxo.id) {
                    setFluxoExpandido(null);
                    setEtapas([]);
                  } else {
                    abrirGerenciamento(fluxo);
                  }
                }}
              >
                📋 {fluxoExpandido === fluxo.id
                  ? 'Fechar etapas'
                  : 'Gerenciar etapas'}
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

            {/* GERENCIAMENTO DE ETAPAS */}

            {fluxoExpandido === fluxo.id && (
              <div style={styles.etapasArea}>

                <h2 style={styles.sectionTitle}>
                  Etapas do fluxo: {fluxo.nome}
                </h2>

                <div style={styles.optionCard}>

                  <h3 style={styles.flowTitle}>
                    {etapaEditando ? 'Editar etapa' : 'Nova etapa'}
                  </h3>

                  <label style={styles.label}>
                    Tipo de etapa
                  </label>

                  <select
                    style={styles.input}
                    value={tipoEtapa}
                    onChange={e => setTipoEtapa(e.target.value)}
                  >
                    <option value="pergunta">Pergunta</option>
                    <option value="tratativa">Tratativa / Orientação</option>
                  </select>

                  <label style={styles.label}>
                    Título
                  </label>

                  <input
                    style={styles.input}
                    placeholder="Ex: O equipamento está ligado?"
                    value={tituloEtapa}
                    onChange={e => setTituloEtapa(e.target.value)}
                  />

                  <label style={styles.label}>
                    Conteúdo / Orientação
                  </label>

                  <textarea
                    style={styles.input}
                    rows={5}
                    placeholder="Descreva a pergunta ou procedimento..."
                    value={conteudoEtapa}
                    onChange={e => setConteudoEtapa(e.target.value)}
                  />

                  <label style={styles.label}>
                    Ordem
                  </label>

                  <input
                    style={styles.input}
                    type="number"
                    min="1"
                    value={ordemEtapa}
                    onChange={e => setOrdemEtapa(e.target.value)}
                  />

                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={etapaInicial}
                      onChange={e => setEtapaInicial(e.target.checked)}
                    />
                    Definir como etapa inicial
                  </label>

                  {tipoEtapa === 'pergunta' && (
                    <>
                      <h3 style={styles.sectionTitle}>
                        Respostas e direcionamentos
                      </h3>

                      <p style={styles.description}>
                        Cadastre as respostas e indique qual será
                        a próxima etapa para cada uma.
                      </p>

                      {opcoes.map((opcao, index) => (
                        <div key={index} style={styles.card}>

                          <label style={styles.label}>
                            Resposta {index + 1}
                          </label>

                          <input
                            style={styles.input}
                            placeholder="Ex: Sim, resolveu"
                            value={opcao.texto}
                            onChange={e =>
                              atualizarOpcao(
                                index,
                                'texto',
                                e.target.value
                              )
                            }
                          />

                          <label style={styles.label}>
                            Próxima etapa
                          </label>

                          <select
                            style={styles.input}
                            value={opcao.proxima_etapa_id}
                            onChange={e =>
                              atualizarOpcao(
                                index,
                                'proxima_etapa_id',
                                e.target.value
                              )
                            }
                          >
                            <option value="">
                              Selecione uma etapa
                            </option>

                            {etapas
                              .filter(e => e.id !== etapaEditando)
                              .map(e => (
                                <option key={e.id} value={e.id}>
                                  {e.ordem} - {e.titulo}
                                </option>
                              ))}
                          </select>

                          {opcoes.length > 2 && (
                            <button
                              style={styles.deleteButton}
                              onClick={() => removerOpcao(index)}
                            >
                              Remover resposta
                            </button>
                          )}

                        </div>
                      ))}

                      <button
                        style={styles.secondaryButton}
                        onClick={adicionarOpcao}
                      >
                        + Adicionar resposta
                      </button>
                    </>
                  )}

                  <div style={styles.actions}>
                    <button
                      style={styles.mainButton}
                      disabled={salvando}
                      onClick={() => salvarEtapa(fluxo.id)}
                    >
                      {salvando ? 'Salvando...' : 'Salvar etapa'}
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

                </div>

                <h3 style={styles.sectionTitle}>
                  Etapas cadastradas ({etapas.length})
                </h3>

                {etapas.map(etapa => (
                  <div key={etapa.id} style={styles.card}>

                    <div style={styles.header}>
                      <h3 style={styles.flowTitle}>
                        {etapa.ordem}. {etapa.titulo}
                      </h3>

                      <span style={styles.badge}>
                        {etapa.tipo.toUpperCase()}
                      </span>
                    </div>

                    {etapa.etapa_inicial && (
                      <p style={styles.initial}>
                        ⭐ ETAPA INICIAL
                      </p>
                    )}

                    <p style={styles.description}>
                      {etapa.conteudo || 'Sem conteúdo.'}
                    </p>

                    {etapa.opcoes?.map(opcao => {
                      const destino = etapas.find(
                        e => e.id === opcao.proxima_etapa_id
                      );

                      return (
                        <p key={opcao.id} style={styles.metadata}>
                          → {opcao.texto} → {destino?.titulo || 'Destino não configurado'}
                        </p>
                      );
                    })}

                    <div style={styles.actions}>
                      <button
                        style={styles.mainButton}
                        onClick={() => editarEtapa(etapa)}
                      >
                        ✏️ Editar etapa
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() => excluirEtapa(etapa, fluxo.id)}
                      >
                        🗑️ Excluir etapa
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
    marginTop: 20,
    marginBottom: 15
  },

  card: {
    background: '#111',
    border: '1px solid #333',
    borderRadius: 14,
    padding: 20,
    marginBottom: 18
  },

  etapasArea: {
    marginTop: 25,
    paddingTop: 20,
    borderTop: '1px solid #444'
  },

  label: {
    display: 'block',
    color: '#ddd',
    marginTop: 12,
    marginBottom: 7
  },

  input: {
    width: '100%',
    padding: 12,
    background: '#0b0b0b',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: 8,
    marginBottom: 10
  },

  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 15,
    color: '#FFD600'
  },

  optionCard: {
    background: '#1a1a1a',
    border: '1px solid #444',
    borderRadius: 10,
    padding: 18,
    marginTop: 15
  },

  description: {
    color: '#ccc',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.6
  },

  metadata: {
    color: '#999',
    fontSize: 13
  },

  initial: {
    color: '#FFD600',
    fontWeight: 'bold'
  },

  badge: {
    color: '#FFD600',
    fontSize: 12,
    fontWeight: 'bold'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap'
  },

  flowTitle: {
    color: '#fff',
    margin: 0
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

  text: {
    color: '#fff'
  }
};
