import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, role } = req.body;

  try {
    // tenta criar usuário
    const { data, error } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

    // se já existe no auth, pega ele ao invés de quebrar tudo
    let user = data?.user;

    if (!user && error?.message?.includes('already been registered')) {
      // busca usuário existente
      const { data: list } =
        await supabaseAdmin.auth.admin.listUsers();

      user = list.users.find(u => u.email === email);
    }

    if (!user) {
      return res.status(400).json({ error: error.message });
    }

    // GARANTE PROFILE SEMPRE
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        role: role || 'user'
      });

    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
