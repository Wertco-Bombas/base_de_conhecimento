import { supabase } from './supabaseClient';

export async function logAction({ user_id, action, entity, entity_id, description }) {
  await supabase.from('audit_log').insert([
    {
      user_id,
      action,
      entity,
      entity_id,
      description,
      created_at: new Date()
    }
  ]);
}
