export function canEdit(user) {
  return user?.role === 'admin' || user?.role === 'supervisor';
}

export function canCreateTopics(user) {
  return !!user;
}

export function isAdmin(user) {
  return user?.role === 'admin';
}
