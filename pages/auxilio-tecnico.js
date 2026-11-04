
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function AuxilioTecnico() {

  const [categoria, setCategoria] = useState('');
  const [fluxos, setFluxos] = useState([]);
  const [fluxoSelecionado, setFluxoSelecionado] = useState(null);

  const [etapas, setEtapas] = useState([]);
  const [opcoes, setOpcoes] = useState([]);

  const [etapaAtual, setEtapaAtual] = useState(null);
  const [historico, setHistorico] = useState([]);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarFluxos();
  }, [categoria]);

  async function carregarFluxos() {

    if (!categoria) {
      setFluxos([]);
      return;
    }

    setLoading(true);
    setErro('');

    const { data, error } = await supabase
      .from('aux_fluxos')
      .select('*')
      .eq('categoria', categoria)
      .eq('ativo', true)
      .eq('publicado', true)
      .order('nome');

    if (error) {
      setErro('Erro ao carregar fluxos: ' + error.message);
      setLoading(false);
      return;
    }

    setFluxos(data || []);
    setLoading(false);
  }

  async function abrirFluxo(fluxo) {

    setLoading(true);
    setErro('');

    const { data: etapasData, error: etapasError } =
      await supabase
        .from('aux_etapas')
        .select('*')
        .eq('fluxo_id', fluxo.id)
        .order('ordem');

    if (etapasError) {
      setErro(etapasError.message);
      setLoading(false);
      return;
    }

    const { data: opcoesData, error: opcoesError } =
      await supabase
        .from('aux_opcoes')
        .select('*')
        .order('ordem');

    if (opcoesError) {
      setErro(opcoesError.message);
      setLoading(false);
      return;
    }

    const etapasFluxo = etapasData || [];
    const opcoesFluxo = opcoesData || [];

    const inicial = etapasFluxo.find(
      etapa => etapa.etapa_inicial
    );

    if (!inicial) {
      setErro('Este fluxo não possui uma etapa inicial configurada.');
      setLoading(false);
      return;
    }

    setFluxoSelecionado(fluxo);
    setEtapas(etapasFluxo);
    setOpcoes(
      opcoesFluxo.filter(opcao =>
        etapasFluxo.some(etapa => etapa.id === opcao.etapa_id)
      )
    );

    setEtapaAtual(inicial);
    setHistorico([]);
    setLoading(false);
  }

  function responder(opcao) {

    const proxima = etapas.find(
      etapa => etapa.id === opcao.proxima_etapa_id
    );

    if (!proxima) {
      setErro('A próxima etapa não foi encontrada.');
      return;
    }

    setHistorico(prev => [
      ...prev,
      {
        pergunta: etapaAtual.titulo,
        resposta: opcao.texto,
        etapa: etapaAtual.id
      }
    ]);

    setEtapaAtual(proxima);
    setErro('');
  }

  function voltar() {

    if (historico.length === 0) {
      setEtapaAtual(null);
      setFluxoSelecionado(null);
      return;
    }

    const anterior = historico[historico.length - 1];

    const etapaAnterior = etapas.find(
      etapa => etapa.id === anterior.etapa
    );

    setEtapaAtual(etapaAnterior);
    setHistorico(prev => prev.slice(0, -1));
  }

  function reiniciar() {
    setFluxoSelecionado(null);
    setEtapaAtual(null);
    setEtapas([]);
    setOpcoes([]);
    setHistorico([]);
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

        <h1 style={styles.titulo}>
          🔧 Auxílio Técnico
        </h1>

        <p style={styles.subtitulo}>
          Selecione uma categoria e siga as orientações
          para identificar e solucionar o problema.
        </p>

        {erro && (
          <div style={styles.erro}>
            {erro}
          </div>
        )}

        {!fluxoSelecionado && (

          <>
            <div style={styles.categorias}>

              <button
                style={{
                  ...styles.categoria,
                  ...(categoria === 'eletronico'
                    ? styles.selecionado
                    : {})
                }}
                onClick={() => setCategoria('eletronico')}
              >
                ⚡ Eletrônico
              </button>

              <button
                style={{
                  ...styles.categoria,
                  ...(categoria === 'hidraulico'
                    ? styles.selecionado
                    : {})
                }}
                onClick={() => setCategoria('hidraulico')}
              >
                💧 Hidráulico
              </button>

            </div>

            {loading && (
              <p style={styles.texto}>
                Carregando fluxos...
              </p>
            )}

            {categoria && !loading && (

              <div>

                <h2 style={styles.subtitulo}>
                  Fluxos disponíveis
                </h2>

                {fluxos.length === 0 && (
                  <div style={styles.card}>
                    Nenhum fluxo publicado nesta categoria.
                  </div>
                )}

                {fluxos.map(fluxo => (

                  <div key={fluxo.id} style={styles.card}>

                    <h3>{fluxo.nome}</h3>

                    <p style={styles.descricao}>
                      {fluxo.descricao || 'Sem descrição.'}
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
                {fluxoSelecionado.nome}
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
                  <p>
                    Esta pergunta ainda não possui respostas
                    cadastradas.
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

                <h3>
                  ✅ Orientação apresentada
                </h3>

                <p>
                  Siga as instruções acima para realizar
                  o procedimento indicado.
                </p>

                <button
                  style={styles.botao}
                  onClick={reiniciar}
                >
                  Finalizar atendimento
                </button>

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

  categorias: {
    display: 'flex',
    gap: 15,
    flexWrap: 'wrap',
    marginBottom: 30
  },

  categoria: {
    flex: 1,
    minWidth: 180,
    padding: 22,
    background: '#171717',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: 12,
    fontSize: 18,
    cursor: 'pointer'
  },

  selecionado: {
    border: '2px solid #FFD600',
    color: '#FFD600',
    background: '#242000'
  },

  card: {
    background: '#141414',
    border: '1px solid #333',
    borderRadius: 14,
    padding: 22,
    marginBottom: 18
  },

  descricao: {
    color: '#aaa',
    whiteSpace: 'pre-wrap'
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
    marginTop: 20
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
  }

};
