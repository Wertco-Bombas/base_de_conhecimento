export function isAdmin(user) {
  return user?.role === 'admin';
}
export function canAutoApprove(user) {
  return user?.role === 'admin' || user?.role === 'supervisor';
}

export function isSupervisor(user) {
  return user?.role === 'supervisor';
}

export function isPrivileged(user) {
  return user?.role === 'admin' || user?.role === 'supervisor';
}

export function canEdit(user, item) {
  if (!user) return false;

  // admin e supervisor podem tudo
  if (isPrivileged(user)) return true;

  // user comum só pode editar os próprios itens
  if (!item?.user_id || !user?.id) return false;

  return item.user_id === user.id;
}

export function canDelete(user, item) {
  if (!user) return false;

  if (isPrivileged(user)) return true;

  if (!item?.user_id || !user?.id) return false;

  return item.user_id === user.id;
}

export function canCreateTopics(user) {
  return !!user;
}

export function canApprove(user) {
  return isPrivileged(user);
}
