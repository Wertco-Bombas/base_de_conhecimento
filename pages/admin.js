import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Admin() {

  const [users, setUsers] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    setUsers(data || []);
  }

  async function updateRole(id, role) {

    await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id);

    load();
  }

  async function createUser() {

    const email = prompt('Email');
    const role = prompt('Role (user/supervisor/admin)');

    await supabase
      .from('profiles')
      .insert({ email, role });

    load();
  }

  return (
    <Layout>

      <h1>Admin Users</h1>

      <button onClick={createUser}>Criar usuário</button>

      {users.map(u => (
        <div key={u.id} style={{ padding: 10 }}>

          <p>{u.email} - {u.role}</p>

          <button onClick={() => updateRole(u.id, 'user')}>user</button>
          <button onClick={() => updateRole(u.id, 'supervisor')}>supervisor</button>
          <button onClick={() => updateRole(u.id, 'admin')}>admin</button>

        </div>
      ))}

    </Layout>
  );
}
