import { useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function useToastAudit() {
  useEffect(() => {
    const channel = supabase
      .channel('audit_toast')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_log' },
        (payload) => {
          alert(`Nova ação: ${payload.new.action}`);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);
}
