const STORAGE_KEY = 'smartmart.auth';

export function decodeJwtPayload(token) {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

export function getTokenExpiryMs(token) {
  const payload = decodeJwtPayload(token);
  return payload?.exp ? payload.exp * 1000 : null;
}

export function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeStoredAuth(authState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export function normalizeProfile(profile, token) {
  const payload = decodeJwtPayload(token) || {};

  return {
    user_id: String(profile?.user_id ?? payload.user_id ?? ''),
    username: profile?.username ?? payload.username ?? '',
    role_id: String(profile?.role_id ?? payload.role_id ?? ''),
    role_name: (profile?.role_name ?? payload.role_name ?? '').toLowerCase(),
    permissions: Array.isArray(profile?.permissions)
      ? profile.permissions
      : Array.isArray(payload.permissions)
        ? payload.permissions
        : [],
  };
}

export function getDefaultRoute(roleName) {
  const role = String(roleName || '').toLowerCase();

  switch (role) {
    case 'superadmin':
    case 'admin':
      return '/admin-panel';
    case 'cashier':
      return '/pos';
    case 'hr':
      return '/hr';
    case 'inventory':
      return '/inventory';
    case 'procurement':
      return '/procurement';
    case 'analyst':
    case 'management':
    case 'manager':
      return '/analytics';
    default:
      return '/';
  }
}
