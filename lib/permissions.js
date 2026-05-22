export function isAdmin(user) {
  return user?.role === 'admin';
}

export function isSupervisor(user) {
  return user?.role === 'supervisor' || user?.role === 'admin';
}

export function canCreateTopics(user) {
  return isSupervisor(user);
}

export function canDeleteTopics(user) {
  return isAdmin(user);
}

export function canManageUsers(user) {
  return isAdmin(user);
}
