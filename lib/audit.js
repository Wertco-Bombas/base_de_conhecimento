import { supabase } from './supabaseClient';

export async function logAction({ user, action, entity, entity_id }) {
  await supabase.from('audit_log').insert([
    {
      user_id: user.id,
      action,
      entity,
      entity_id,
      created_at: new Date()
    }
  ]);
}
