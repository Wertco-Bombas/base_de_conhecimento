import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function useRealtimeAudit() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // carregar inicial
    load();

    const channel = supabase
      .channel('audit_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_log' },
        (payload) => {
          setEvents((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function load() {
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    setEvents(data || []);
  }

  return events;
}
