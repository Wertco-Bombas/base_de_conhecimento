jsx
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function EditarEtapas() {
  const router = useRouter();
  const { fluxo } = router.query;

  const [user, setUser] = useState(null);
  const [fluxoInfo, setFluxoInfo] = useState(null);
  const [etapas, setEtapas] = useState([]);
  const [opcoes, setOpcoes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [etapaId, setEtapaId] = useState(null);
  const [tipo, setTipo] = useState('pergunta');
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [ordem, setOrdem] = useState(0);
  const [etapaInicial, setEtapaInicial] = useState(false);

  const [textoOpcao, setTextoOpcao] = useState('');
  const [proximaEtapa, setProximaEtapa] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    if (!fluxo) return;

    iniciar();
  }, [router.isReady, fluxo]);

  async function iniciar() {
    setLoading(true);

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

    setFluxoInfo(data);
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
    setEtapas(lista);

    if (lista.length > 0) {
      const ids = lista.map(e => e.id);

      const { data: opcoesData, error: opcoesError } =
        await supabase
          .from('aux_opcoes')
          .select('*')
          .in('etapa_id', ids)
          .order('ordem');

      if (opcoesError) {
        alert('Erro ao carregar opções: ' + opcoesError.message);
        return;
      }

      setOpcoes(opcoesData || []);
    } else {
      setOpcoes([]);
    }
  }

  function limparFormulario() {
    setEtapaId(null);
    setTipo('pergunta');
    setTitulo('');
    setConteudo('');
    setOrdem(etapas.length);
    setEtapaInicial(false);
  }

  async function salvarEtapa() {
    if (!titulo.trim()) {
      alert('Informe o título da etapa.');
      return;
    }

    setSalvando(true);

    if (etapaInicial) {
      const { error: inicialError } = await supabase
        .from('aux_etapas')
        .update({ etapa_inicial: false })
        .eq('fluxo_id', fluxo);

      if (inicialError) {
        alert(inicialError.message);
        setSalvando(false);
        return;
      }
    }

    const dados = {
      fluxo_id: fluxo,
      tipo,
      titulo: titulo.trim(),
      conteudo: conteudo.trim(),
      ordem: Number(ordem),
      etapa_inicial: etapaInicial,
      updated_at: new Date().toISOString()
    };

    let resultado;

    if (etapaId) {
      resultado = await supabase
        .from('aux_etapas')
        .update(dados)
        .eq('id', etapaId);
    } else {
      resultado = await supabase
        .from('aux_etapas')
        .insert(dados);
    }

    setSalvando(false);

    if (resultado.error) {
      alert('Erro ao salvar etapa: ' + resultado.error.message);
      return;
    }

    alert('Etapa salva com sucesso!');

    limparFormulario();
    await carregarEtapas();
  }

  function editarEtapa(etapa) {
    setEtapaId(etapa.id);
    setTipo(etapa.tipo);
    setTitulo(etapa.titulo);
    setConteudo(etapa.conteudo || '');
    setOrdem(etapa.ordem);
    setEtapaInicial(etapa.etapa_inicial);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  async function excluirEtapa(id) {
    const confirmar = confirm(
      'Deseja realmente excluir esta etapa? As opções relacionadas também serão excluídas.'
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from('aux_etapas')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Erro ao excluir: ' + error.message);
      return;
    }

    alert('Etapa excluída!');
    await carregarEtapas();
  }

  async function salvarOpcao(etapa) {
    if (!textoOpcao.trim()) {
      alert('Informe o texto da opção.');
      return;
    }

    if (!proximaEtapa) {
      alert('Selecione a próxima etapa.');
      return;
    }

    if (proximaEtapa === etapa.id) {
      alert('Uma etapa não pode apontar para ela mesma.');
      return;
    }

    const { error } = await supabase
      .from('aux_opcoes')
      .insert({
        etapa_id: etapa.id,
        texto: textoOpcao.trim(),
        proxima_etapa_id: proximaEtapa,
        ordem: opcoes.filter(o => o.etapa_id === etapa.id).length
      });

    if (error) {
      alert('Erro ao salvar opção: ' + error.message);
      return;
    }

    setTextoOpcao('');
    setProximaEtapa('');

    alert('Opção cadastrada!');
    await carregarEtapas();
  }

  async function excluirOpcao(id) {
    if (!confirm('Deseja excluir esta opção?')) return;

    const { error } = await supabase
      .from('aux_opcoes')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Erro ao excluir opção: ' + error.message);
      return;
    }

    await carregarEtapas();
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

        <button
          style={styles.secondaryButton}
          onClick={() => router.push('/gerenciar-fluxos')}
        >
          ← Voltar aos fluxos
        </button>

        <h1 style={styles.heading}>
          📋 Gerenciar Etapas
        </h1>

        {fluxoInfo && (
          <div style={styles.card}>
            <h2>{fluxoInfo.nome}</h2>
            <p>{fluxoInfo.descricao}</p>
            <p>Categoria: {fluxoInfo.categoria}</p>
          </div>
        )}

        <div style={styles.card}>
          <h2 style={styles.yellow}>
            {etapaId ? 'Editar Etapa' : 'Nova Etapa'}
          </h2>

          <label style={styles.label}>Tipo de etapa</label>

          <select
            style={styles.input}
            value={tipo}
            onChange={e => setTipo(e.target.value)}
          >
            <option value="pergunta">Pergunta</option>
            <option value="tratativa">Tratativa</option>
          </select>

          <label style={styles.label}>Título</label>

          <input
            style={styles.input}
            placeholder="Ex: Equipamento liga?"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
          />

          <label style={styles.label}>Conteúdo / Orientação</label>

          <textarea
            style={styles.input}
            rows={5}
            placeholder="Descreva a pergunta ou orientação técnica..."
            value={conteudo}
            onChange={e => setConteudo(e.target.value)}
          />

          <label style={styles.label}>Ordem</label>

          <input
            style={styles.input}
            type="number"
            value={ordem}
            onChange={e => setOrdem(e.target.value)}
          />

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={etapaInicial}
              onChange={e => setEtapaInicial(e.target.checked)}
            />
            Esta é a etapa inicial do fluxo
          </label>

          <div style={styles.actions}>
            <button
              style={styles.mainButton}
              onClick={salvarEtapa}
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Salvar Etapa'}
            </button>

            {etapaId && (
              <button
                style
