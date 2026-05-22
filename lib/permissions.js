export function canCreateTopics(user) {
  return user?.role === 'admin' || user?.role === 'supervisor';
}

export function canDelete(user) {
  return user?.role === 'admin';
}

export function canAccessAdmin(user) {
  return user?.role === 'admin';
}
