export function isAdmin(user) {
  return user?.role === 'admin';
}

export function isSupervisor(user) {
  return user?.role === 'supervisor';
}

export function isPrivileged(user) {
  return user?.role === 'admin' || user?.role === 'supervisor';
}

/* AUTO APPROVE */
export function canAutoApprove(user) {
  return isPrivileged(user);
}

export function canApprove(user) {
  return isPrivileged(user);
}

export function canEdit(user, item) {

  if (!user) return false;

  if (isPrivileged(user)) return true;

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
