import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    for (const user of data.users) {
      await supabaseAdmin.from('profiles').upsert({
        id: user.id,
        email: user.email,
        role: 'user'
      });
    }

    return res.status(200).json({
      ok: true,
      total: data.users.length
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
