import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!error) router.push('/menu');
    else alert('Erro no login');
  };

  return (
    <div style={styles.container}>
      <h1 style={{ color: '#f5c400' }}>Login</h1>

      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} style={styles.input} />
      <input type="password" placeholder="Senha" onChange={(e) => setPassword(e.target.value)} style={styles.input} />

      <button onClick={login} style={styles.btn}>Entrar</button>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    background: '#0d0d0d',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  input: {
    margin: '5px',
    padding: '10px',
    width: '250px',
    borderRadius: '6px',
    border: '1px solid #333',
    background: '#1a1a1a',
    color: '#fff'
  },
  btn: {
    marginTop: '10px',
    background: '#f5c400',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};
