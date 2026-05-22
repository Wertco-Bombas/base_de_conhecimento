import { supabase } from './supabaseClient';

export function subscribeToChanges(callback) {
  return supabase
    .channel('db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'topicos' },
      callback
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'comentarios' },
      callback
    )
    .subscribe();
}
