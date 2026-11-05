
import { useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function AuxilioTecnico() {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState([]);

  const [fluxoSelecionado, setFluxoSelecionado] = useState(null);
  const [etapas, setEtapas] = useState([]);
  const [etapaAtual, setEtapaAtual] = useState(null);

  const [historico, setHistorico] = useState([]);
  const [etapaResolucao, setEtapaResolucao] = useState(null);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const [finalizado, setFinalizado] = useState(false);
  const [resolvido, setResolvido] = useState(false);

  // PESQUISAR FLUXOS
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

  // ABRIR FLUXO E CARREGAR ORIENTAÇÕES
  async function abrirFluxo(fluxo) {
    setLoading(true);
    setErro('');

    const { data, error } = await supabase
      .from('aux_etapas')
      .select('*')
      .eq('fluxo_id', fluxo.id)
      .order('ordem', { ascending: true });

    if (error) {
      setErro('Erro ao carregar orientações: ' + error.message);
      setLoading(false);
      return;
    }

    const listaEtapas = (data || []).sort(
      (a, b) => Number(a.ordem) - Number(b.ordem)
    );

    if (listaEtapas.length === 0) {
      setErro('Este fluxo ainda não possui orientações cadastradas.');
      setLoading(false);
      return;
    }

    // Busca a orientação inicial.
    // Se não houver marcação, utiliza a primeira pela ordem.
    const inicial =
      listaEtapas.find(e => e.etapa_inicial === true) ||
      listaEtapas[0];

    setFluxoSelecionado(fluxo);
    setEtapas(listaEtapas);
    setEtapaAtual(inicial);

    setHistorico([]);
    setEtapaResolucao(null);

    setFinalizado(false);
    setResolvido(false);

    setLoading(false);
  }

  // ANALISTA INFORMOU QUE RESOLVEU
  function marcarResolvido() {
    if (!etapaAtual) return;

    setEtapaResolucao(etapaAtual);
    setResolvido(true);
    setFinalizado(true);
    setErro('');
  }

  // ANALISTA INFORMOU QUE NÃO RESOLVEU
  function proximaOrientacao() {
    if (!etapaAtual) return;

    const indiceAtual = etapas.findIndex(
      e => e.id === etapaAtual.id
    );

    const proxima = etapas[indiceAtual + 1];

    // Registra a orientação percorrida.
    setHistorico(prev => [...prev, etapaAtual.id]);

    if (!proxima) {
      // Não existem mais orientações.
      setResolvido(false);
      setFinalizado(true);
      setEtapaResolucao(null);
      setErro('');
      return;
    }

    // Avança para a próxima orientação.
    setEtapaAtual(proxima);
    setErro('');
  }

  // VOLTAR PARA ORIENTAÇÃO ANTERIOR
  function voltar() {
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

  // SAIR DO ATENDIMENTO
  function sairDoFluxo() {
    setFluxoSelecionado(null);
    setEtapas([]);
    setEtapaAtual(null);
    setHistorico([]);

    setEtapaResolucao(null);

    setFinalizado(false);
    setResolvido(false);

    setErro('');
  }

  // NOVA PESQUISA
  function novaPesquisa() {
    sairDoFluxo();
    setBusca('');
    setResultados([]);
  }

  const numeroEtapaAtual = etapaAtual
    ? etapas.findIndex(e => e.id === etapaAtual.id) + 1
    : 0;

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

        {/* PESQUISA */}

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

                    {fluxo.palavras_chave && (
                      <p style={styles.metadata}>
                        Palavras-chave: {fluxo.palavras_chave}
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

        {/* ATENDIMENTO */}

        {fluxoSelecionado && etapaAtual && !finalizado && (
          <div style={styles.card}>

            <div style={styles.topoFluxo}>
              <span style={styles.identificacao}>
                {fluxoSelecionado.nome}
              </span>

              <span style={styles.identificacao}>
                ORIENTAÇÃO {numeroEtapaAtual} DE {etapas.length}
              </span>
            </div>

            <div style={styles.barraContainer}>
              <div
                style={{
                  ...styles.barraProgresso,
                  width: `${(numeroEtapaAtual / etapas.length) * 100}%`
                }}
              />
            </div>

            <p style={styles.progresso}>
              Passo {numeroEtapaAtual} de {etapas.length}
            </p>

            <h2 style={styles.pergunta}>
              {etapaAtual.titulo}
            </h2>

            {etapaAtual.conteudo && (
              <div style={styles.conteudo}>
                {etapaAtual.conteudo}
              </div>
            )}

            <p style={styles.instrucao}>
              Após realizar este procedimento, informe o resultado:
            </p>

            <div style={styles.respostas}>

              <button
                style={styles.botaoResolvido}
                onClick={marcarResolvido}
              >
                ✓ Resolveu o problema
              </button>

              <button
                style={styles.botaoNaoResolvido}
                onClick={proximaOrientacao}
              >
                ✕ Não resolveu, próximo passo
              </button>

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

        {/* FINALIZAÇÃO */}

        {finalizado && (
          <div style={styles.card}>

            {resolvido ? (
              <div style={styles.finalizacaoSucesso}>

                <h2>
                  ✅ Problema resolvido!
                </h2>

                <p>
                  O atendimento foi concluído com sucesso.
                </p>

                <p>
                  **Problema:** {fluxoSelecionado?.nome}
                </p>

                <p>
                  **Resolvido na orientação:**
                  {' '}{etapaResolucao?.ordem} - {etapaResolucao?.titulo}
                </p>

              </div>
            ) : (
              <div style={styles.finalizacaoAlerta}>

                <h2>
                  ⚠️ Todas as orientações foram realizadas
                </h2>

                <p>
                  O problema não foi resolvido após a execução
                  de todos os procedimentos cadastrados.
                </p>

                <p>
                  É necessário encaminhar o atendimento para
                  avaliação da equipe técnica ou gestão.
                </p>

              </div>
            )}

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

  barraContainer: {
    height: 7,
    background: '#333',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 20
  },

  barraProgresso: {
    height: '100%',
    background: '#FFD600',
    borderRadius: 10,
    transition: 'width 0.3s'
  },

  progresso: {
    color: '#888',
    marginTop: 12,
    fontSize: 13
  },

  pergunta: {
    fontSize: 25,
    marginTop: 25,
    marginBottom: 20,
    color: '#FFD600'
  },

  conteudo: {
    background: '#202020',
    padding: 18,
    borderRadius: 10,
    whiteSpace: 'pre-wrap',
    lineHeight: 1.7,
    marginBottom: 20,
    color: '#fff'
  },

  instrucao: {
    color: '#ccc',
    marginTop: 20,
    marginBottom: 15
  },

  respostas: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },

  botaoResolvido: {
    width: '100%',
    background: '#174522',
    border: '1px solid #36a852',
    color: '#fff',
    padding: 18,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer'
  },

  botaoNaoResolvido: {
    width: '100%',
    background: '#38251a',
    border: '1px solid #bd783e',
    color: '#fff',
    padding: 18,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer'
  },

  finalizacaoSucesso: {
    background: '#172217',
    border: '1px solid #387438',
    padding: 18,
    borderRadius: 10,
    marginBottom: 15,
    lineHeight: 1.7
  },

  finalizacaoAlerta: {
    background: '#382b18',
    border: '1px solid #b58a36',
    padding: 18,
    borderRadius: 10,
    marginBottom: 15,
    lineHeight: 1.7
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
