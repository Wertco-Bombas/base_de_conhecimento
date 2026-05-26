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
    let user = null;

    // 1. tenta criar usuário
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (data?.user) {
      user = data.user;
    }

    // 2. se já existe, busca direto
    if (!user) {
      const { data: found } =
        await supabaseAdmin.auth.admin.listUsers();

      user = found.users.find(u => u.email === email);
    }

    if (!user) {
      return res.status(400).json({ error: 'Usuário não encontrado no Auth' });
    }

    // 3. GARANTE PROFILE (sem depender de trigger)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email,
          role: role || 'user'
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error(profileError);
      return res.status(500).json({
        error: 'Erro ao salvar profile',
        detail: profileError.message
      });
    }

    return res.status(200).json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: role || 'user'
      }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
