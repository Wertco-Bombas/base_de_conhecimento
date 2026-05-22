export function isAdmin(user) {
  return user?.role === 'admin';
}

export function isSupervisor(user) {
  return user?.role === 'supervisor';
}

export function canManageUsers(user) {
  return user?.role === 'admin';
}

export function canViewAdmin(user) {
  return user?.role === 'admin';
}
