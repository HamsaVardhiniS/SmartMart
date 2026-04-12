import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';

export default function ProtectedRoute({ children, roles, permissions }) {
  const { isAuthenticated, user, loading, defaultRoute } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && roles.length > 0) {
    const userRole = user?.role_name?.toLowerCase();
    const allowed = roles.map(r => r.toLowerCase());
    if (!allowed.includes(userRole)) {
      return (
        <Layout>
          <div className="page-content">
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', color: '#ef4444' }}>Access Denied</h2>
              <p className="text-muted">You do not have permission to view this page.</p>
              <p className="text-muted mt-2">Your role: <strong>{user?.role_name}</strong></p>
            </div>
          </div>
        </Layout>
      );
    }
  }

  if (permissions && permissions.length > 0) {
    const userPermissions = user?.permissions || [];
    const allowed = permissions.every(permission => userPermissions.includes(permission));

    if (!allowed) {
      return <Navigate to={defaultRoute} replace />;
    }
  }

  return <Layout>{children}</Layout>;
}
