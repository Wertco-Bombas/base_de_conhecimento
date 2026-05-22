import { supabase } from './supabaseClient';

export async function log(action, user, entity, entity_id) {
  await supabase.from('audit_log').insert([
    {
      action,
      user_id: user?.id,
      entity,
      entity_id,
      created_at: new Date()
    }
  ]);
}
