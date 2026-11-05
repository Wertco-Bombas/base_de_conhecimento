
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
  const [finalizado, setFinalizado] = useState(false);
  const [resolvido, setResolvido] = useState(false);

  async function pesquisar() {
    if (!busca.trim()) {
      setErro('Digite um código de erro ou uma palavra para pesquisar.');
      return;
    }

    setLoading(true);
    setErro('');
    setResultados([]);

    const termo = busca.trim().replace(/[,%()]/g, ' ');

    const { data, error } = await supabase
      .from('aux_fluxos')
      .select('*')
      .eq('ativo', true)
      .eq('publicado', true)
      .or(
        `nome.ilike.%${termo}%,codigo_erro.ilike.%${termo}%,palavras_chave.ilike.%${termo}%,descricao.ilike.%${termo}%`
      )
      .order('nome');

    if (error) {
      setErro('Erro na pesquisa: ' + error.message);
      setLoading(false);
      return;
    }

    setResultados(data || []);

    if (!data?.length) {
      setErro('Nenhum procedimento encontrado para sua pesquisa.');
    }

    setLoading(false);
  }

  async function abrirFluxo(fluxo) {
    setLoading(true);
    setErro('');

    const { data: etapasData, error: etapasError } = await supabase
      .from('aux_etapas')
      .select('*')
      .eq('fluxo_id', fluxo.id)
      .order('ordem');

    if (etapasError) {
      setErro('Erro ao carregar etapas: ' + etapasError.message);
      setLoading(false);
      return;
    }

    const listaEtapas = etapasData || [];

    if (!listaEtapas.length) {
      setErro('Este fluxo ainda não possui etapas cadastradas.');
      setLoading(false);
      return;
    }

    const ids = listaEtapas.map(e => e.id);

    const { data: opcoesData, error: opcoesError } = await supabase
      .from('aux_opcoes')
      .select('*')
      .in('etapa_id', ids)
      .order('ordem');

    if (opcoesError) {
      setErro('Erro ao carregar respostas: ' + opcoesError.message);
      setLoading(false);
      return;
    }

    const inicial = listaEtapas.find(e => e.etapa_inicial);

    if (!inicial) {
      setErro('Este fluxo não possui uma etapa inicial.');
      setLoading(false);
      return;
    }

    setFluxoSelecionado(fluxo);
    setEtapas(listaEtapas);
    setOpcoes(opcoesData || []);
    setEtapaAtual(inicial);

    setHistorico([]);
    setFinalizado(false);
    setResolvido(false);

    setLoading(false);
  }

  function responder(opcao) {
    if (!etapaAtual) return;

    const proxima = etapas.find(
      e => e.id === opcao.proxima_etapa_id
    );

    // Resposta sem destino significa encerramento.
    if (!opcao.proxima_etapa_id) {
      setFinalizado(true);

      const texto = opcao.texto.trim().toLowerCase();
      setResolvido(texto === 'sim');

      return;
    }

    if (!proxima) {
      setErro('A próxima etapa não foi encontrada.');
      return;
    }

    setHistorico(prev => [
      ...prev,
      etapaAtual.id
    ]);

    setEtapaAtual(proxima);
    setErro('');
  }

  function voltar() {
    if (finalizado) {
      setFinalizado(false);
      return;
    }

    if (!historico.length) {
      sairDoFluxo();
      return;
    }

    const anteriorId = historico[historico.length - 1];

    const anterior = etapas.find(
      e => e.id === anteriorId
    );

    if (anterior) {
      setEtapaAtual(anterior);
      setHistorico(prev => prev.slice(0, -1));
      setErro('');
    }
  }

  function sairDoFluxo() {
    setFluxoSelecionado(null);
    setEtapas([]);
    setOpcoes([]);
    setEtapaAtual(null);
    setHistorico([]);
    setFinalizado(false);
    setResolvido(false);
    setErro('');
  }

  function novaPesquisa() {
    sairDoFluxo();
    setBusca('');
    setResultados([]);
  }

  const opcoesAtuais = etapaAtual
    ? opcoes
        .filter(o => o.etapa_id === etapaAtual.id)
        .sort((a, b) => a.ordem - b.ordem)
    : [];

  return (
    <Layout>
      <div style={styles.container}>

        <h1 style={styles.titulo}>
          🔧 Auxílio Técnico
        </h1>

        <p style={styles.subtitulo}>
          Pesquise pelo código do erro ou descreva o problema
          para encontrar um procedimento de atendimento.
        </p>

        {!fluxoSelecionado && (
          <>
            <div style={styles.buscaContainer}>
              <input
                style={styles.busca}
                placeholder="Ex: E1025, bomba não liga..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') pesquisar();
                }}
              />

              <button
                style={styles.botao}
                onClick={pesquisar}
                disabled={loading}
              >
                {loading ? 'Pesquisando...' : '🔎 Pesquisar'}
              </button>
            </div>

            {erro && (
              <div style={styles.erro}>
                {erro}
              </div>
            )}

            {resultados.length > 0 && (
              <>
                <h2 style={styles.subtitulo}>
                  Procedimentos encontrados ({resultados.length})
                </h2>

                {resultados.map(fluxo => (
                  <div key={fluxo.id} style={styles.card}>
                    <h3 style={styles.nomeFluxo}>
                      {fluxo.nome}
                    </h3>

                    <p style={styles.descricao}>
                      {fluxo.descricao || 'Sem descrição.'}
                    </p>

                    {fluxo.codigo_erro && (
                      <p style={styles.metadata}>
                        Código: {fluxo.codigo_erro}
                      </p>
                    )}

                    <button
                      style={styles.botao}
                      onClick={() => abrirFluxo(fluxo)}
                      disabled={loading}
                    >
                      Iniciar atendimento →
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {fluxoSelecionado && etapaAtual && !finalizado && (
          <div style={styles.card}>

            <div style={styles.topoFluxo}>
              <span style={styles.identificacao}>
                {fluxoSelecionado.nome}
              </span>

              <span style={styles.identificacao}>
                {etapaAtual.tipo === 'pergunta'
                  ? 'PERGUNTA'
                  : 'TRATATIVA'}
              </span>
            </div>

            <p style={styles.progresso}>
              Etapas percorridas: {historico.length + 1}
            </p>

            <h2 style={styles.pergunta}>
              {etapaAtual.titulo}
            </h2>

            {etapaAtual.conteudo && (
              <div style={styles.conteudo}>
                {etapaAtual.conteudo}
              </div>
            )}

            {opcoesAtuais.length === 0 && (
              <div style={styles.erro}>
                Esta etapa ainda não possui respostas cadastradas.
                Entre em contato com a gestão.
              </div>
            )}

            <div style={styles.respostas}>
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

            <div style={styles.acoes}>
              <button
                style={styles.voltar}
                onClick={voltar}
              >
                ← Voltar
              </button>

              <button
                style={styles.voltar}
                onClick={sairDoFluxo}
              >
                Sair do atendimento
              </button>
            </div>

          </div>
        )}

        {finalizado && (
          <div style={styles.card}>

            <div style={styles.finalizacao}>
              <h2>
                {resolvido
                  ? '✅ Problema resolvido!'
                  : '⚠️ Atendimento encerrado'}
              </h2>

              <p>
                {resolvido
                  ? 'Ótimo! A orientação resolveu o problema informado.'
                  : 'O atendimento foi encerrado. A gestão ou equipe técnica deverá avaliar a necessidade de suporte adicional.'}
              </p>
            </div>

            <button
              style={styles.botao}
              onClick={novaPesquisa}
            >
              Finalizar e voltar à pesquisa
            </button>

          </div>
        )}

        {erro && fluxoSelecionado && (
          <div style={styles.erro}>
            {erro}
          </div>
        )}

        {loading && fluxoSelecionado && (
          <p style={styles.subtitulo}>
            Carregando atendimento...
          </p>
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

  buscaContainer: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 25
  },

  busca: {
    flex: 1,
    minWidth: 220,
    padding: 16,
    background: '#171717',
    color: '#fff',
    border: '1px solid #555',
    borderRadius: 10,
    fontSize: 16
  },

  card: {
    background: '#141414',
    border: '1px solid #333',
    borderRadius: 14,
    padding: 22,
    marginBottom: 18
  },

  nomeFluxo: {
    color: '#FFD600',
    fontSize: 21
  },

  descricao: {
    color: '#aaa',
    whiteSpace: 'pre-wrap'
  },

  metadata: {
    color: '#888',
    fontSize: 13
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
    padding: 18,
    borderRadius: 10,
    marginBottom: 15
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
  }
};
