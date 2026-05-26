async function createUser() {
  if (!newEmail || !newPassword) {
    return alert('Preencha email e senha');
  }

  try {
    setLoading(true);

    const res = await fetch('/api/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: newEmail,
        password: newPassword,
        role: newRole
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      return alert(data.error);
    }

    setNewEmail('');
    setNewPassword('');
    setNewRole('user');

    await load();

    setLoading(false);

    alert('Usuário criado com sucesso');

  } catch (err) {
    console.error(err);
    setLoading(false);
    alert('Erro ao criar usuário');
  }
}
