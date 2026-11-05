import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

// Dentro do componente:
const router = useRouter();

useEffect(() => {
  if (!router.isReady) return;

  const id = router.query.fluxo;

  if (!id || typeof id !== 'string') {
    setLoading(false);
    return;
  }

  setFluxo(id);
  iniciar(id);
}, [router.isReady, router.query.fluxo]);

// Altere as assinaturas:
async function iniciar(fluxoId) {
  try {
    const { data: auth, error: authError } = await supabase.auth.getUser();

    if (authError || !auth?.user) {
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

    await carregarFluxo(fluxoId);
    await carregarEtapas(fluxoId);
  } catch (error) {
    alert('Erro ao iniciar: ' + error.message);
  } finally {
    setLoading(false);
  }
}

async function carregarFluxo(fluxoId) {
  const { data, error } = await supabase
    .from('aux_fluxos')
    .select('*')
    .eq('id', fluxoId)
    .single();

  if (error) throw error;

  setDadosFluxo(data);
}

async function carregarEtapas(fluxoId) {
  const { data, error } = await supabase
    .from('aux_etapas')
    .select('*')
    .eq('fluxo_id', fluxoId)
    .order('ordem');

  if (error) throw error;

  const lista = data || [];
  let etapasComOpcoes = lista;

  if (lista.length > 0) {
    const ids = lista.map(etapa => etapa.id);

    const { data: opcoesData, error: opcoesError } = await supabase
      .from('aux_opcoes')
      .select('*')
      .in('etapa_id', ids)
      .order('ordem');

    if (opcoesError) throw opcoesError;

    etapasComOpcoes = lista.map(etapa => ({
      ...etapa,
      opcoes: (opcoesData || []).filter(
        opcao => opcao.etapa_id === etapa.id
      )
    }));
  }

  setEtapas(etapasComOpcoes);
}
