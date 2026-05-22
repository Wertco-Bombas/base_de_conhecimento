export function canEdit(user) {
  return user?.role === 'admin' || user?.role === 'supervisor';
}

export function canDelete(user) {
  return user?.role === 'admin';
}

export function canCreate(user) {
  return user?.role !== 'user';
}
