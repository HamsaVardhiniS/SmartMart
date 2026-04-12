import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/admin/AdminPanel';
import POSPanel from './pages/pos/POSPanel';
import HRPanel from './pages/hr/HRPanel';
import InventoryPanel from './pages/inventory/InventoryPanel';
import ProcurementPanel from './pages/procurement/ProcurementPanel';
import AnalyticsPanel from './pages/analytics/AnalyticsPanel';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-panel"
            element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute roles={['admin', 'superadmin', 'cashier']}>
                <POSPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr"
            element={
              <ProtectedRoute roles={['admin', 'superadmin', 'hr']}>
                <HRPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute roles={['admin', 'superadmin', 'inventory']}>
                <InventoryPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/procurement"
            element={
              <ProtectedRoute roles={['admin', 'superadmin', 'procurement']}>
                <ProcurementPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute roles={['admin', 'superadmin', 'analyst', 'management', 'manager']}>
                <AnalyticsPanel />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
