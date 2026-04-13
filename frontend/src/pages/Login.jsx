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
      setError('Please enter your email/username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const profile = await login(identifier.trim(), password);
      navigate(getDefaultRoute(profile.role_name), { replace: true });
    } catch (err) {
      const backendError = err?.response?.data?.message || err?.response?.data?.error;
      setError(backendError || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card-centered">
        <div className="login-logo-blue">
          <span>Smart</span><span>Mart</span>
        </div>
        <p className="login-tagline">Retail Operations Portal</p>

        {sessionMessage && <div className="alert alert-info">{sessionMessage}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label-blue">Email / Username</label>
            <input
              id="login-identifier"
              type="text"
              className="form-input-blue"
              placeholder="Enter your email or username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label-blue">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input-blue"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn-login-blue"
            disabled={loading}
          >
            {loading ? (
              <span className="login-spinner-wrap">
                <span className="login-spinner" />
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="login-footer-note">
          Access is role-restricted. Contact your administrator if you need an account.
        </p>
      </div>
    </div>
  );
}
