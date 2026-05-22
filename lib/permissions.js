export function canEdit(user) {
  return user?.role === 'admin' || user?.role === 'supervisor';
}

export function canDelete(user) {
  return user?.role === 'admin';
}

export function canUpload(user) {
  return user?.role !== 'user';
}
