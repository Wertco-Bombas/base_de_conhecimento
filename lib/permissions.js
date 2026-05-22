export function canAccessAdmin(user) {
  return user?.role === 'admin' || user?.role === 'supervisor';
}

export function canAccessTraining(user) {
  return true; // todos acessam
}

export function canEditOwn(user, item) {
  return item?.user_id === user?.id;
}

export function canApprove(user) {
  return user?.role === 'admin' || user?.role === 'supervisor';
}

export function canDelete(user, item) {
  return user?.role !== 'user' || item?.user_id === user?.id;
}

export function isUser(user) {
  return user?.role === 'user';
}
