export function isAdmin(user) {
  return user?.role === 'admin';
}

export function isSupervisor(user) {
  return user?.role === 'supervisor';
}

export function canEdit(user, item) {
  if (!user) return false;

  // admin e supervisor podem tudo
  if (user.role === 'admin' || user.role === 'supervisor') return true;

  // user comum só pode editar os próprios itens
  return item ? item.user_id === user.id : false;
}

export function canDelete(user, item) {
  if (!user) return false;

  if (user.role === 'admin' || user.role === 'supervisor') return true;

  return item ? item.user_id === user.id : false;
}

export function canCreateTopics(user) {
  return !!user;
}

export function canApprove(user) {
  return user?.role === 'admin' || user?.role === 'supervisor';
}
