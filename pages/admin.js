async function init() {
  const u = await getCurrentUser();
  setUser(u);

  if (!u || !isAdmin(u)) {
    alert('Acesso negado');
    window.location.href = '/base';
    return;
  }

  fetchUsers();
  fetchLogs();
}
