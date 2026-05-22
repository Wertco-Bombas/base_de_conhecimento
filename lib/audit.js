import { supabase } from './supabaseClient';

export async function log(action, user, entity, entityId) {
  await supabase.from('audit_log').insert([
    {
      action,
      user_id: user?.id,
      entity,
      entity_id: entityId,
      created_at: new Date()
    }
  ]);
}
