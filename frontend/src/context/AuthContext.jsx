import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getSessionProfile, loginUser } from '../api/auth.api';
import {
  clearStoredAuth,
  getDefaultRoute,
  getTokenExpiryMs,
  isTokenExpired,
  normalizeProfile,
  readStoredAuth,
  writeStoredAuth,
} from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const logoutTimerRef = useRef(null);

  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const logout = (reason = 'manual') => {
    clearLogoutTimer();
    clearStoredAuth();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    const suffix = reason === 'expired' ? '?reason=expired' : '';
    window.location.href = `/login${suffix}`;
  };

  const scheduleAutoLogout = (nextToken) => {
    clearLogoutTimer();
    const expiresAt = getTokenExpiryMs(nextToken);
    if (!expiresAt) return;

    const msUntilExpiry = expiresAt - Date.now();
    if (msUntilExpiry <= 0) {
      logout('expired');
      return;
    }

    logoutTimerRef.current = window.setTimeout(() => logout('expired'), msUntilExpiry);
  };

  const applyAuthState = (nextToken, profile) => {
    const normalizedUser = normalizeProfile(profile, nextToken);
    const authState = { token: nextToken, user: normalizedUser };

    writeStoredAuth(authState);
    setToken(nextToken);
    setUser(normalizedUser);
    setIsAuthenticated(true);
    scheduleAutoLogout(nextToken);

    return normalizedUser;
  };

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const stored = readStoredAuth();
      if (!stored?.token) {
        if (active) setLoading(false);
        return;
      }

      if (isTokenExpired(stored.token)) {
        clearStoredAuth();
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await getSessionProfile(stored.token);
        if (!active) return;
        applyAuthState(stored.token, response.data);
      } catch {
        clearStoredAuth();
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
      clearLogoutTimer();
    };
  }, []);

  const login = async (identifier, password) => {
    const response = await loginUser({ username: identifier, password });
    const nextToken = response.data?.token;
    const profileResponse = await getSessionProfile(nextToken);
    return applyAuthState(nextToken, profileResponse.data);
  };

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    defaultRoute: getDefaultRoute(user?.role_name),
    hasPermission: (permission) => user?.permissions?.includes(permission) ?? false,
  }), [user, token, isAuthenticated, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
