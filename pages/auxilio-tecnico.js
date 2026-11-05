
import { useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function AuxilioTecnico() {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState([]);

  const [fluxoSelecionado, setFluxoSelecionado] = useState(null);
  const [etapas, setEtapas] = useState([]);
  const [opcoes, setOpcoes] = useState([]);

  const [etapaAtual, setEtapaAtual] = useState(null);
  const [historico, setHistorico] = useState([]);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [pesquisou, setPesquisou] = useState(false);
  const [atendimentoConcluido, setAtendimentoConcluido] = useState(false);

  function normalizar(texto) {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  async function pesquisar() {
    if (busca.trim().length < 2) {
      setErro('Digite pelo menos duas letras ou números para pesquisar.');
      return;
    }

    setLoading(true);
    setErro('');
    setPesquisou(true);
    setResultados([]);

    try {
      const termo = normalizar(busca);

      const { data: fluxosData, error: fluxosError } = await supabase
        .from('aux_fluxos')
        .select('*')
        .eq('ativo', true)
        .eq('publicado', true)
        .order('nome');

      if (fluxosError) throw fluxosError;

      const listaFluxos = fluxosData || [];

      if (listaFluxos.length === 0) {
        setResultados([]);
        return;
      }

      const idsFluxos = listaFluxos.map(f => f.id);

      const { data: etapasData, error: etapasError } = await supabase
        .from('aux_etapas')
        .select('*')
        .in('fluxo_id', idsFluxos)
        .order('ordem');

      if (etapasError) throw etapasError;

      const listaEtapas = etapasData || [];

      let listaOpcoes = [];

      if (listaEtapas.length > 0) {
        const idsEtapas = listaEtapas.map(e => e.id);

        const { data: opcoesData, error: opcoesError } = await supabase
          .from('aux_opcoes')
          .select('*')
          .in('etapa_id', idsEtapas);

        if (opcoesError) throw opcoesError;

        listaOpcoes = opcoesData || [];
      }

      const encontrados = listaFluxos.map(fluxo => {
        const etapasFluxo = listaEtapas.filter(
          etapa => etapa.fluxo_id === fluxo.id
        );

        const opcoesFluxo = listaOpcoes.filter(opcao =>
          etapasFluxo.some(etapa => etapa.id === opcao.etapa_id)
        );

        const textos = [
          fluxo.nome,
          fluxo.descricao,
          ...etapasFluxo.map(etapa => etapa.titulo),
          ...etapasFluxo.map(etapa => etapa.conteudo),
          ...opcoesFluxo.map(opcao => opcao.texto)
        ];

        const correspondencias = textos.filter(texto =>
          normalizar(texto).includes(termo)
        );

        if (correspondencias.length === 0) return null;

        return {
          ...fluxo,
          etapasEncontradas: etapasFluxo.length,
          correspondencias: correspondencias.length
        };
      }).filter(Boolean);

      encontrados.sort((a, b) =>
        b.correspondencias - a.correspondencias
      );

      setResultados(encontrados);

      if (encontrados.length === 0) {
        setErro('Nenhum fluxo encontrado para essa pesquisa.');
      }

    } catch (error) {
      setErro('Erro ao pesquisar: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function abrirFluxo(fluxo) {
    setLoading(true);
    setErro('');

    try {
      const { data: etapasData, error: etapasError } = await supabase
        .from('aux_etapas')
        .select('*')
        .eq('fluxo_id', fluxo.id)
        .order('ordem');

      if (etapasError) throw etapasError;

      const etapasFluxo = etapasData || [];

      if (etapasFluxo.length === 0) {
        setErro('Este fluxo ainda não possui etapas cadastradas.');
        return;
      }

      const iniciais = etapasFluxo.filter(e => e.etapa_inicial);

      if (iniciais.length !== 1) {
        setErro('Este fluxo precisa ter exatamente uma etapa inicial.');
        return;
      }

      const idsEtapas = etapasFluxo.map(e => e.id);

      const { data: opcoesData, error: opcoesError } = await supabase
        .from('aux_opcoes')
        .select('*')
        .in('etapa_id', idsEtapas)
        .order('ordem');

      if (opcoesError) throw opcoesError;

      setFluxoSelecionado(fluxo);
      setEtapas(etapasFluxo);
      setOpcoes(opcoesData || []);

      setEtapaAtual(iniciais[0]);
      setHistorico([]);
      setAtendimentoConcluido(false);

    } catch (error) {
      setErro('Erro ao abrir fluxo: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function responder(opcao) {
    if (!etapaAtual) return;

    setHistorico(prev => [
      ...prev,
      etapaAtual.id
    ]);

    setErro('');

    if (!opcao.proxima_etapa_id) {
      setAtendimentoConcluido(true);
      return;
    }

    const proxima = etapas.find(
      etapa => etapa.id === opcao.proxima_etapa_id
    );

    if (!proxima) {
      setHistorico(prev => prev.slice(0, -1));
      setErro('A próxima etapa não foi encontrada. Verifique o cadastro do fluxo.');
      return;
    }

    setEtapaAtual(proxima);
  }

  function voltar() {
    if (historico.length === 0) {
      reiniciar();
      return;
    }

    const anterior = historico[historico.length - 1];

    const etapaAnterior = etapas.find(
      etapa => etapa.id === anterior
    );

    if (!etapaAnterior) {
      setErro('Não foi possível recuperar a etapa anterior.');
      return;
    }

    setEtapaAtual(etapaAnterior);
    setHistorico(prev => prev.slice(0, -1));
    setAtendimentoConcluido(false);
    setErro('');
  }

  function reiniciar() {
    setFluxoSelecionado(null);
    setEtapas([]);
    setOpcoes([]);
    setEtapaAtual(null);
    setHistorico([]);
    setAtendimentoConcluido(false);
    setErro('');
  }

  const opcoesAtuais = etapaAtual
    ? opcoes
        .filter(opcao => opcao.etapa_id === etapaAtual.id)
        .sort((a, b) => a.ordem - b.ordem)
    : [];

  return (
    <Layout>
      <div style={styles.container}>

        {!fluxoSelecionado && (
          <>
            <h1 style={styles.titulo}>
              🔧 Auxílio Técnico
            </h1>

            <p style={styles.subtitulo}>
              Pesquise pelo código de erro, equipamento ou descrição
              do problema para encontrar procedimentos técnicos.
            </p>

            {erro && (
              <div style={styles.erro}>
                {erro}
              </div>
            )}

            <div style={styles.pesquisaCard}>
              <label style={styles.label}>
                O que está acontecendo?
              </label>

              <div style={styles.pesquisaLinha}>
                <input
                  style={styles.campoBusca}
                  placeholder="Ex: Erro E01, equipamento não liga..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') pesquisar();
                  }}
                />

                <button
                  style={styles.botaoPesquisar}
                  onClick={pesquisar}
                  disabled={loading}
                >
                  {loading ? 'Pesquisando...' : '🔍 Pesquisar'}
                </button>
              </div>

              <p style={styles.ajuda}>
                Você pode pesquisar por código de erro,
                palavra-chave ou descrição do problema.
              </p>
            </div>

            {loading && (
              <p style={styles.texto}>
                Pesquisando procedimentos técnicos...
              </p>
            )}

            {!loading && pesquisou && (
              <div>
                <h2 style={styles.subtitulo}>
                  Resultados encontrados ({resultados.length})
                </h2>

                {resultados.map(fluxo => (
                  <div key={fluxo.id} style={styles.card}>
                    <div style={styles.topoResultado}>
                      <h3 style={styles.nomeFluxo}>
                        {fluxo.nome}
                      </h3>

                      <span style={styles.categoria}>
                        {fluxo.categoria === 'eletronico'
                          ? '⚡ Eletrônico'
                          : '💧 Hidráulico'}
                      </span>
                    </div>

                    <p style={styles.descricao}>
                      {fluxo.descricao || 'Sem descrição.'}
                    </p>

                    <p style={styles.metadata}>
                      {fluxo.etapasEncontradas} etapas cadastradas
                    </p>

                    <button
                      style={styles.botao}
                      onClick={() => abrirFluxo(fluxo)}
                    >
                      Iniciar atendimento →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {fluxoSelecionado && etapaAtual && (
          <div style={styles.card}>

            <div style={styles.topoFluxo}>
              <span style={styles.identificacao}>
                🔧 {fluxoSelecionado.nome}
              </span>

              <span style={styles.identificacao}>
                {etapaAtual.tipo === 'pergunta'
                  ? 'PERGUNTA'
                  : 'TRATATIVA'}
              </span>
            </div>

            <div style={styles.progresso}>
              Etapas percorridas: {historico.length + 1}
            </div>

            {!atendimentoConcluido && (
              <>
                <h2 style={styles.pergunta}>
                  {etapaAtual.titulo}
                </h2>

                {etapaAtual.conteudo && (
                  <div style={styles.conteudo}>
                    {etapaAtual.conteudo}
                  </div>
                )}

                {etapaAtual.tipo === 'pergunta' && (
                  <div style={styles.respostas}>

                    {opcoesAtuais.length === 0 && (
                      <p style={styles.descricao}>
                        Esta pergunta ainda não possui respostas cadastradas.
                      </p>
                    )}

                    {opcoesAtuais.map(opcao => (
                      <button
                        key={opcao.id}
                        style={styles.resposta}
                        onClick={() => responder(opcao)}
                      >
                        {opcao.texto}
                        <span> → </span>
                      </button>
                    ))}

                  </div>
                )}

                {etapaAtual.tipo === 'tratativa' && (
                  <div style={styles.finalizacao}>
                    <h3>Orientação apresentada</h3>

                    <p>
                      Siga as instruções acima para realizar
                      o procedimento indicado.
                    </p>

                    <button
                      style={styles.botao}
                      onClick={() => setAtendimentoConcluido(true)}
                    >
                      Finalizar atendimento
                    </button>
                  </div>
                )}
              </>
            )}

            {atendimentoConcluido && (
              <div style={styles.finalizacao}>
                <h2>✅ Atendimento finalizado!</h2>

                <p>
                  O procedimento foi encerrado conforme a resposta
                  selecionada.
                </p>

                <p>
                  Fluxo: <strong>{fluxoSelecionado.nome}</strong>
                </p>

                <button
                  style={styles.botao}
                  onClick={reiniciar}
                >
                  Finalizar e voltar à pesquisa
                </button>
              </div>
            )}

            {erro && (
              <div style={styles.erro}>
                {erro}
              </div>
            )}

            <div style={styles.acoes}>
              <button
                style={styles.voltar}
                onClick={voltar}
              >
                ← Voltar
              </button>

              <button
                style={styles.voltar}
                onClick={reiniciar}
              >
                Sair do fluxo
              </button>
            </div>

          </div>
        )}

      </div>
    </Layout>
  );
}

const styles = {
  container: {
    maxWidth: 950,
    margin: '0 auto',
    color: '#fff',
    padding: 10
  },

  titulo: {
    color: '#FFD600',
    fontSize: 30,
    marginBottom: 10
  },

  subtitulo: {
    color: '#aaa',
    marginBottom: 25
  },

  pesquisaCard: {
    background: '#141414',
    border: '1px solid #333',
    borderRadius: 14,
    padding: 22,
    marginBottom: 25
  },

  label: {
    display: 'block',
    color: '#ddd',
    marginBottom: 10,
    fontWeight: 'bold'
  },

  pesquisaLinha: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap'
  },

  campoBusca: {
    flex: 1,
    minWidth: 200,
    padding: 15,
    background: '#0b0b0b',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: 8,
    fontSize: 15
  },

  botaoPesquisar: {
    background: '#FFD600',
    color: '#000',
    border: 'none',
    padding: '13px 20px',
    borderRadius: 8,
    fontWeight: 'bold',
    cursor: 'pointer'
  },

  ajuda: {
    color: '#777',
    fontSize: 12,
    marginTop: 12
  },

  card: {
    background: '#141414',
    border: '1px solid #333',
    borderRadius: 14,
    padding: 22,
    marginBottom: 18
  },

  topoResultado: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap'
  },

  nomeFluxo: {
    color: '#fff',
    margin: 0
  },

  categoria: {
    color: '#FFD600',
    fontSize: 12
  },

  descricao: {
    color: '#aaa',
    whiteSpace: 'pre-wrap'
  },

  metadata: {
    color: '#777',
    fontSize: 12
  },

  botao: {
    background: '#FFD600',
    color: '#000',
    border: 'none',
    padding: '13px 20px',
    borderRadius: 8,
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: 12
  },

  topoFluxo: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap'
  },

  identificacao: {
    color: '#FFD600',
    fontSize: 12,
    fontWeight: 'bold'
  },

  progresso: {
    color: '#888',
    marginTop: 20,
    fontSize: 13
  },

  pergunta: {
    fontSize: 25,
    marginTop: 25,
    marginBottom: 20
  },

  conteudo: {
    background: '#202020',
    padding: 18,
    borderRadius: 10,
    whiteSpace: 'pre-wrap',
    lineHeight: 1.7,
    marginBottom: 20
  },

  respostas: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },

  resposta: {
    width: '100%',
    textAlign: 'left',
    background: '#202020',
    border: '1px solid #555',
    color: '#fff',
    padding: 18,
    borderRadius: 10,
    fontSize: 16,
    cursor: 'pointer'
  },

  finalizacao: {
    background: '#172217',
    border: '1px solid #387438',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    color: '#fff'
  },

  acoes: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 25
  },

  voltar: {
    background: 'transparent',
    border: '1px solid #FFD600',
    color: '#FFD600',
    padding: '10px 16px',
    borderRadius: 8,
    cursor: 'pointer'
  },

  erro: {
    background: '#401818',
    border: '1px solid #d44',
    color: '#ffaaaa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20
  },

  texto: {
    color: '#fff'
  },

  successText: {
    color: '#80d890'
  }
};
