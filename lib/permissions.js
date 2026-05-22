export function isAdmin(user) {
  return user?.role === 'admin';
}

export function isSupervisor(user) {
  return user?.role === 'supervisor';
}

export function canEdit(user) {
  return user?.role === 'admin' || user?.role === 'supervisor';
}

export function canCreate(user) {
  return user?.role !== 'user';
}
