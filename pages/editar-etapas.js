import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function EditarEtapas() {
  const router = useRouter();
  const { fluxo } = router.query;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [dadosFluxo, setDadosFluxo] = useState(null);
  const [etapas, setEtapas] = useState([]);

  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [tipo, setTipo] = useState('pergunta');
  const [ordem, setOrdem] = useState(1);
  const [etapaInicial, setEtapaInicial] = useState(false);

  const [opcoes, setOpcoes] = useState([
    { texto: 'Sim', proxima_etapa_id: '' },
    { texto: 'Não', proxima_etapa_id: '' }
  ]);

  const [editando, setEditando] = useState(null);

  useEffect(() => {
    if (fluxo) {
      iniciar();
    }
  }, [fluxo]);

  async function iniciar() {
    const { data: auth } = await supabase.auth.getUser();

    if (!auth?.user) {
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
      alert('Acesso não autorizado.');
      router.replace('/base');
      return;
    }

    setUser(auth.user);

    await carregarFluxo();
    await carregarEtapas();

    setLoading(false);
  }

  async function carregarFluxo() {
    const { data, error } = await supabase
      .from('aux_fluxos')
      .select('*')
      .eq('id', fluxo)
      .single();

    if (error) {
      alert('Erro ao carregar fluxo: ' + error.message);
      return;
    }

    setDadosFluxo(data);
  }

  async function carregarEtapas() {
    const { data, error } = await supabase
      .from('aux_etapas')
      .select('*')
      .eq('fluxo_id', fluxo)
      .order('ordem');

    if (error) {
      alert('Erro ao carregar etapas: ' + error.message);
      return;
    }

    const lista = data || [];

    const etapasComOpcoes = await Promise.all(
      lista.map(async etapa => {
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

    setEtapas(etapasComOpcoes);
  }

  function limparFormulario() {
    setTitulo('');
    setConteudo('');
    setTipo('pergunta');
    setOrdem(etapas.length + 1);
    setEtapaInicial(false);
    setOpcoes([
      { texto: 'Sim', proxima_etapa_id: '' },
      { texto: 'Não', proxima_etapa_id: '' }
    ]);
    setEditando(null);
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
    novas[index][campo] = valor;
    setOpcoes(novas);
  }
    async function salvarEtapa() {
    if (!titulo.trim()) {
      alert('Informe o título da etapa.');
      return;
    }

    if (tipo === 'pergunta') {
      if (opcoes.length < 2) {
        alert('Uma pergunta precisa ter pelo menos duas opções.');
        return;
      }

      if (opcoes.some(o => !o.texto.trim())) {
        alert('Preencha todas as opções.');
        return;
      }

      if (opcoes.some(o => !o.proxima_etapa_id)) {
        alert('Defina a próxima etapa de cada opção.');
        return;
      }
    }

    setSalvando(true);

    try {
      const dadosEtapa = {
        fluxo_id: fluxo,
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        tipo,
        ordem: Number(ordem),
        etapa_inicial: etapaInicial,
        updated_at: new Date().toISOString()
      };

      if (etapaInicial) {
        const { error: inicialError } = await supabase
          .from('aux_etapas')
          .update({ etapa_inicial: false })
          .eq('fluxo_id', fluxo);

        if (inicialError) throw inicialError;
      }

      let etapaId = editando;

      if (editando) {
        const { error } = await supabase
          .from('aux_etapas')
          .update(dadosEtapa)
          .eq('id', editando);

        if (error) throw error;

        const { error: excluirOpcoesError } = await supabase
          .from('aux_opcoes')
          .delete()
          .eq('etapa_id', editando);

        if (excluirOpcoesError) throw excluirOpcoesError;
      } else {
        const { data, error } = await supabase
          .from('aux_etapas')
          .insert(dadosEtapa)
          .select()
          .single();

        if (error) throw error;

        etapaId = data.id;
      }

      if (tipo === 'pergunta') {
        const dadosOpcoes = opcoes.map((opcao, index) => ({
          etapa_id: etapaId,
          texto: opcao.texto.trim(),
          proxima_etapa_id: opcao.proxima_etapa_id,
          ordem: index + 1
        }));

        const { error } = await supabase
          .from('aux_opcoes')
          .insert(dadosOpcoes);

        if (error) throw error;
      }

      alert('Etapa salva com sucesso!');

      limparFormulario();
      await carregarEtapas();

    } catch (error) {
      alert('Erro ao salvar etapa: ' + error.message);
    } finally {
      setSalvando(false);
    }
  }

  function editarEtapa(etapa) {
    setEditando(etapa.id);
    setTitulo(etapa.titulo);
    setConteudo(etapa.conteudo || '');
    setTipo(etapa.tipo);
    setOrdem(etapa.ordem);
    setEtapaInicial(etapa.etapa_inicial);

    setOpcoes(
      etapa.opcoes?.length
        ? etapa.opcoes.map(o => ({
            texto: o.texto,
            proxima_etapa_id: o.proxima_etapa_id
          }))
        : [
            { texto: 'Sim', proxima_etapa_id: '' },
            { texto: 'Não', proxima_etapa_id: '' }
          ]
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  async function excluirEtapa(etapa) {
    const confirmar = confirm(
      `Deseja excluir a etapa "${etapa.titulo}"?`
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

    alert('Etapa excluída!');

    if (editando === etapa.id) {
      limparFormulario();
    }

    await carregarEtapas();
  }
    if (loading) {
    return (
      <Layout>
        <p style={styles.text}>Carregando etapas...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>

        <button
          style={styles.secondaryButton}
          onClick={() => router.push('/gerenciar-fluxos')}
        >
          ← Voltar aos fluxos
        </button>

        <h1 style={styles.heading}>
          🔧 Gerenciar Etapas
        </h1>

        <h2 style={styles.flowTitle}>
          {dadosFluxo?.nome || 'Fluxo'}
        </h2>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            {editando ? 'Editar etapa' : 'Nova etapa'}
          </h2>

          <label style={styles.label}>
            Tipo de etapa
          </label>

          <select
            style={styles.input}
            value={tipo}
            onChange={e => {
              setTipo(e.target.value);

              if (e.target.value === 'pergunta') {
                setOpcoes([
                  { texto: 'Sim', proxima_etapa_id: '' },
                  { texto: 'Não', proxima_etapa_id: '' }
                ]);
              }
            }}
          >
            <option value="pergunta">Pergunta</option>
            <option value="tratativa">Tratativa</option>
          </select>

          <label style={styles.label}>
            Título da etapa
          </label>

          <input
            style={styles.input}
            placeholder="Ex: O equipamento liga?"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
          />

          <label style={styles.label}>
            Conteúdo / Orientação
          </label>

          <textarea
            style={styles.input}
            rows={4}
            placeholder="Descreva a pergunta ou orientação técnica..."
            value={conteudo}
            onChange={e => setConteudo(e.target.value)}
          />

          <label style={styles.label}>
            Ordem
          </label>

          <input
            style={styles.input}
            type="number"
            min="1"
            value={ordem}
            onChange={e => setOrdem(e.target.value)}
          />

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={etapaInicial}
              onChange={e => setEtapaInicial(e.target.checked)}
            />
            Definir como etapa inicial
          </label>

          {tipo === 'pergunta' && (
            <>
              <h3 style={styles.sectionTitle}>
                Respostas e direcionamentos
              </h3>

              <p style={styles.description}>
                Cadastre pelo menos duas respostas e escolha
                para qual etapa cada resposta deverá direcionar.
              </p>

              {opcoes.map((opcao, index) => (
                <div key={index} style={styles.optionCard}>

                  <label style={styles.label}>
                    Resposta {index + 1}
                  </label>

                  <input
                    style={styles.input}
                    placeholder="Ex: Sim"
                    value={opcao.texto}
                    onChange={e =>
                      atualizarOpcao(index, 'texto', e.target.value)
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
                      Selecione a próxima etapa
                    </option>

                   {etapas
  .filter(etapa => {
    if (etapa.id === editando) return false;

    const selecionadaEmOutraResposta = opcoes.some(
      (outraOpcao, outroIndex) =>
        outroIndex !== index &&
        outraOpcao.proxima_etapa_id === etapa.id
    );

    return !selecionadaEmOutraResposta;
  })
  .map(etapa => (
    <option
      key={etapa.id}
      value={etapa.id}
    >
      {etapa.ordem} - {etapa.titulo}
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
              onClick={salvarEtapa}
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Salvar etapa'}
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

        <h2 style={styles.sectionTitle}>
          Etapas cadastradas ({etapas.length})
        </h2>

        {etapas.length === 0 && (
          <div style={styles.card}>
            Nenhuma etapa cadastrada.
          </div>
        )}

        {etapas.map(etapa => (
          <div key={etapa.id} style={styles.card}>

            <div style={styles.header}>
              <h3 style={styles.flowTitle}>
                {etapa.ordem}. {etapa.titulo}
              </h3>

              <span style={styles.badge}>
                {etapa.tipo === 'pergunta' ? 'PERGUNTA' : 'TRATATIVA'}
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

            {etapa.opcoes?.length > 0 && (
              <div style={styles.optionList}>
                <strong>Respostas:</strong>

                {etapa.opcoes.map(opcao => {
                  const destino = etapas.find(
                    e => e.id === opcao.proxima_etapa_id
                  );

                  return (
                    <p key={opcao.id}>
                      • {opcao.texto} → {destino?.titulo || 'Destino não encontrado'}
                    </p>
                  );
                })}
              </div>
            )}

            <div style={styles.actions}>
              <button
                style={styles.mainButton}
                onClick={() => editarEtapa(etapa)}
              >
                ✏️ Editar
              </button>

              <button
                style={styles.deleteButton}
                onClick={() => excluirEtapa(etapa)}
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
    maxWidth: 1100,
    margin: '0 auto',
    color: '#fff'
  },

  heading: {
    color: '#FFD600',
    marginTop: 25
  },

  flowTitle: {
    color: '#fff',
    margin: 0
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
    padding: 15,
    marginTop: 15,
    marginBottom: 12
  },

  optionList: {
    background: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    color: '#ddd'
  },

  description: {
    color: '#aaa',
    whiteSpace: 'pre-wrap'
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
