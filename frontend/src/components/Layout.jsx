import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '◫', roles: ['admin', 'superadmin', 'cashier', 'hr', 'inventory', 'procurement', 'analyst', 'management', 'manager'] },
  { path: '/admin-panel', label: 'Admin Panel', icon: '⌘', roles: ['admin', 'superadmin'] },
  { path: '/pos', label: 'Point of Sale', icon: '◉', roles: ['admin', 'superadmin', 'cashier'] },
  { path: '/hr', label: 'HR Management', icon: '◎', roles: ['admin', 'superadmin', 'hr'] },
  { path: '/inventory', label: 'Inventory', icon: '▣', roles: ['admin', 'superadmin', 'inventory'] },
  { path: '/procurement', label: 'Procurement', icon: '▦', roles: ['admin', 'superadmin', 'procurement'] },
  { path: '/analytics', label: 'Analytics', icon: '△', roles: ['admin', 'superadmin', 'analyst', 'management', 'manager'] },
];

const ROLE_COLORS = {
  admin: '#b91c1c',
  superadmin: '#7f1d1d',
  cashier: '#047857',
  hr: '#b45309',
  inventory: '#1d4ed8',
  procurement: '#6d28d9',
  analyst: '#0f766e',
  management: '#0f766e',
  manager: '#0f766e',
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const userRole = user?.role_name?.toLowerCase() || '';
  const roleColor = ROLE_COLORS[userRole] || '#1d4ed8';
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(userRole));
  const activePage = NAV_ITEMS.find((item) => item.path === location.pathname);
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'SM';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>Smart</span>
          <span>Mart</span>
        </div>

        <nav className="nav-section">
          <div className="nav-section-title">Navigation</div>
          {visibleNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              end={item.path === '/'}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar" style={{ background: roleColor }}>
              {initials}
            </div>
            <div>
              <div className="sidebar-username">{user?.username || 'User'}</div>
              <div className="sidebar-role" style={{ color: roleColor }}>
                {user?.role_name || 'Unknown'}
              </div>
            </div>
          </div>

          <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={() => logout('manual')}>
            Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">{activePage?.label || 'SmartMart'}</div>
            <div className="text-sm text-muted">Authenticated execution layer</div>
          </div>
          <div className="topbar-badges">
            <span className="badge" style={{ background: `${roleColor}1A`, color: roleColor, fontWeight: 700 }}>
              {(user?.role_name || 'user').toUpperCase()}
            </span>
            <span className="text-sm text-muted">{user?.username}</span>
          </div>
        </div>

        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
