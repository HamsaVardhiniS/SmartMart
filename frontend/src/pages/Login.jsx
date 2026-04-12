import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultRoute } from '../lib/auth';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const sessionMessage = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('reason') === 'expired'
      ? 'Your session expired. Please sign in again.'
      : '';
  }, [location.search]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      setError('Email or username and password are both required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const profile = await login(identifier.trim(), password);
      navigate(getDefaultRoute(profile.role_name), { replace: true });
    } catch (err) {
      const backendError = err?.response?.data?.message || err?.response?.data?.error;
      setError(backendError || 'Authentication failed. Verify credentials and account status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-copy">
          <div className="login-logo">
            <span>Smart</span>
            <span>Mart</span>
          </div>
          <p className="login-kicker">Execution layer for retail operations</p>
          <h1 className="login-title">Authenticate before any module is allowed to load.</h1>
          <p className="login-subtitle">
            Role-aware access, token-bound API traffic, and session-controlled routing are enforced from the entry gate.
          </p>
          <div className="login-highlights">
            <div className="login-highlight">
              <strong>Secure session</strong>
              <span>Token expiry triggers automatic logout and route reset.</span>
            </div>
            <div className="login-highlight">
              <strong>Permission-driven</strong>
              <span>Role and permission state are hydrated immediately after sign-in.</span>
            </div>
            <div className="login-highlight">
              <strong>Execution-ready</strong>
              <span>Users land directly in the module that matches their operational role.</span>
            </div>
          </div>
        </div>

        <div className="login-card">
          <p className="login-form-label">Secure Sign In</p>
          <h2 className="login-form-title">Single entry point</h2>

          {sessionMessage && <div className="alert alert-info">{sessionMessage}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email / Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter email or username"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
              {loading ? 'Authorizing…' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
