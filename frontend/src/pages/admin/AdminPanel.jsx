import { useState, useEffect } from 'react';
import {
  createRole, assignPermission, createUser,
  getConfig, setConfig, setFeature,
  createApproval, approveRequest,
  getLogs, createDepartment, resetPassword
} from '../../api/admin.api';
import { confirmCriticalAction } from '../../lib/confirm';

const TABS = ['Roles & Permissions', 'Users', 'Config', 'Feature Flags', 'Approvals', 'Audit Logs', 'Departments'];

function Alert({ type, msg, onClose }) {
  if (!msg) return null;
  return (
    <div className={`alert alert-${type}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>✕</button>
    </div>
  );
}

function useForm(initial) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const reset = () => setForm(initial);
  return [form, set, reset, setForm];
}

// ─── Roles Tab ────────────────────────────────────────────────────────────────
function RolesTab() {
  const [roleName, setRoleName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [permId, setPermId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [roles, setRoles] = useState([
    { id: '1', name: 'admin' },
    { id: '2', name: 'cashier' },
    { id: '3', name: 'hr' },
    { id: '4', name: 'inventory' },
    { id: '5', name: 'procurement' },
    { id: '6', name: 'analyst' },
  ]);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) return;
    setLoading(true);
    try {
      const res = await createRole({ role_name: roleName });
      const newRole = res.data;
      setRoles(prev => [...prev, { id: newRole.role_id?.toString() || Date.now().toString(), name: roleName }]);
      setMsg({ type: 'success', text: `Role "${roleName}" created successfully.` });
      setRoleName('');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to create role.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!roleId || !permId) return;
    setLoading(true);
    try {
      await assignPermission({ role_id: roleId, permission_id: permId });
      setMsg({ type: 'success', text: `Permission ${permId} assigned to role ${roleId}.` });
      setRoleId(''); setPermId('');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to assign permission.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Create Role</h3></div>
          <form onSubmit={handleCreateRole}>
            <div className="form-group">
              <label className="form-label">Role Name</label>
              <input className="form-input" value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="e.g. manager" />
            </div>
            <button className="btn btn-primary" disabled={loading}>Create Role</button>
          </form>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Assign Permission</h3></div>
          <form onSubmit={handleAssign}>
            <div className="form-group">
              <label className="form-label">Role ID</label>
              <input className="form-input" value={roleId} onChange={e => setRoleId(e.target.value)} placeholder="Role ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Permission ID</label>
              <input className="form-input" value={permId} onChange={e => setPermId(e.target.value)} placeholder="Permission ID" />
            </div>
            <button className="btn btn-primary" disabled={loading}>Assign</button>
          </form>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h3 className="card-title">Existing Roles</h3></div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>ID</th><th>Role Name</th></tr></thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id}><td>{r.id}</td><td><span className="badge badge-blue">{r.name}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [form, setFormField, resetForm] = useForm({ username: '', password: '', role_id: '', employee_id: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.role_id) {
      setMsg({ type: 'error', text: 'Username, password, and role_id are required.' });
      return;
    }
    setLoading(true);
    try {
      const payload = { username: form.username, password: form.password, role_id: form.role_id };
      if (form.employee_id) payload.employee_id = form.employee_id;
      await createUser(payload);
      setMsg({ type: 'success', text: `User "${form.username}" created successfully.` });
      resetForm();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to create user.' });
    } finally {
      setLoading(false);
    }
  };

  const [resetEmpId, setResetEmpId] = useState('');
  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetEmpId) return;
    if (!confirmCriticalAction(`Trigger password reset for employee ${resetEmpId}?`)) return;
    setLoading(true);
    try {
      await resetPassword({ employee_id: resetEmpId });
      setMsg({ type: 'success', text: `Password reset for employee ${resetEmpId}.` });
      setResetEmpId('');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to reset password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Create User</h3></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input className="form-input" value={form.username} onChange={e => setFormField('username', e.target.value)} placeholder="Username" />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" value={form.password} onChange={e => setFormField('password', e.target.value)} placeholder="Password" />
            </div>
            <div className="form-group">
              <label className="form-label">Role ID *</label>
              <input className="form-input" value={form.role_id} onChange={e => setFormField('role_id', e.target.value)} placeholder="Role ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Employee ID (optional)</label>
              <input className="form-input" value={form.employee_id} onChange={e => setFormField('employee_id', e.target.value)} placeholder="Employee ID" />
            </div>
            <button className="btn btn-primary" disabled={loading}>Create User</button>
          </form>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Reset Password</h3></div>
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input className="form-input" value={resetEmpId} onChange={e => setResetEmpId(e.target.value)} placeholder="Employee ID" />
            </div>
            <button className="btn btn-warning" disabled={loading}>Reset Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Config Tab ───────────────────────────────────────────────────────────────
function ConfigTab() {
  const [configs, setConfigs] = useState([]);
  const [form, setFormField, resetForm] = useForm({ config_key: '', config_value: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchConfig = async () => {
    try {
      const res = await getConfig();
      const data = res.data;
      if (Array.isArray(data)) setConfigs(data);
      else if (data && typeof data === 'object') {
        setConfigs(Object.entries(data).map(([k, v]) => ({ config_key: k, config_value: v })));
      }
    } catch {
      setConfigs([]);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.config_key || !form.config_value) {
      setMsg({ type: 'error', text: 'Both key and value are required.' });
      return;
    }
    setLoading(true);
    try {
      await setConfig({ config_key: form.config_key, config_value: form.config_value });
      setMsg({ type: 'success', text: `Config "${form.config_key}" saved.` });
      resetForm();
      fetchConfig();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to save config.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Set Configuration</h3></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Config Key</label>
              <input className="form-input" value={form.config_key} onChange={e => setFormField('config_key', e.target.value)} placeholder="e.g. tax_rate" />
            </div>
            <div className="form-group">
              <label className="form-label">Config Value</label>
              <input className="form-input" value={form.config_value} onChange={e => setFormField('config_value', e.target.value)} placeholder="e.g. 18" />
            </div>
            <button className="btn btn-primary" disabled={loading}>Save Config</button>
          </form>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Current Configuration</h3>
            <button className="btn btn-secondary btn-sm" onClick={fetchConfig}>Refresh</button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Key</th><th>Value</th></tr></thead>
              <tbody>
                {configs.length === 0 && <tr><td colSpan={2} style={{ textAlign: 'center', color: '#94a3b8' }}>No config found</td></tr>}
                {configs.map((c, i) => (
                  <tr key={i}>
                    <td><code>{c.config_key}</code></td>
                    <td>{c.config_value?.toString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feature Flags Tab ────────────────────────────────────────────────────────
function FeatureFlagsTab() {
  const [features, setFeatures] = useState([
    { feature_name: 'online_payments', is_enabled: true },
    { feature_name: 'loyalty_program', is_enabled: false },
    { feature_name: 'email_notifications', is_enabled: true },
    { feature_name: 'auto_reorder', is_enabled: false },
    { feature_name: 'analytics_dashboard', is_enabled: true },
  ]);
  const [newFeature, setNewFeature] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleToggle = async (idx) => {
    const feat = features[idx];
    const newVal = !feat.is_enabled;
    if (!confirmCriticalAction(`Are you sure you want to ${newVal ? 'enable' : 'disable'} "${feat.feature_name}"?`)) return;
    try {
      await setFeature({ feature_name: feat.feature_name, is_enabled: newVal });
      setFeatures(prev => prev.map((f, i) => i === idx ? { ...f, is_enabled: newVal } : f));
      setMsg({ type: 'success', text: `Feature "${feat.feature_name}" ${newVal ? 'enabled' : 'disabled'}.` });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to update feature.' });
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newFeature.trim()) return;
    try {
      await setFeature({ feature_name: newFeature, is_enabled: true });
      setFeatures(prev => [...prev, { feature_name: newFeature, is_enabled: true }]);
      setMsg({ type: 'success', text: `Feature "${newFeature}" added.` });
      setNewFeature('');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to add feature.' });
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="card">
        <div className="card-header"><h3 className="card-title">Add Feature Flag</h3></div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '12px' }}>
          <input className="form-input" value={newFeature} onChange={e => setNewFeature(e.target.value)} placeholder="feature_name (snake_case)" style={{ flex: 1 }} />
          <button className="btn btn-primary">Add Feature</button>
        </form>
      </div>
      <div className="card">
        <div className="card-header"><h3 className="card-title">Feature Flags</h3></div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Feature Name</th><th>Status</th><th>Toggle</th></tr></thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={i}>
                  <td><code>{f.feature_name}</code></td>
                  <td>
                    <span className={`badge ${f.is_enabled ? 'badge-green' : 'badge-red'}`}>
                      {f.is_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={f.is_enabled} onChange={() => handleToggle(i)} />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Approvals Tab ────────────────────────────────────────────────────────────
function ApprovalsTab() {
  const [form, setFormField, resetForm] = useForm({ requested_by: '', action_type: '', request_data: '' });
  const [approveId, setApproveId] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [approvals, setApprovals] = useState([]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.requested_by || !form.action_type) {
      setMsg({ type: 'error', text: 'requested_by and action_type are required.' });
      return;
    }
    setLoading(true);
    try {
      let requestData = form.request_data;
      if (requestData) {
        try { requestData = JSON.parse(requestData); } catch { /* send as string */ }
      }
      const res = await createApproval({ requested_by: form.requested_by, action_type: form.action_type, request_data: requestData });
      const created = res.data;
      setApprovals(prev => [...prev, {
        id: created.request_id?.toString() || created.id?.toString() || Date.now().toString(),
        requested_by: form.requested_by,
        action_type: form.action_type,
        status: 'pending'
      }]);
      setMsg({ type: 'success', text: 'Approval request created.' });
      resetForm();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to create approval.' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!approveId || !approvedBy) {
      setMsg({ type: 'error', text: 'Approval ID and approver name required.' });
      return;
    }
    if (!confirmCriticalAction(`Approve request #${approveId}? This action cannot be silently undone.`)) return;
    setLoading(true);
    try {
      await approveRequest(approveId, { approved_by: approvedBy });
      setApprovals(prev => prev.map(a => a.id === approveId ? { ...a, status: 'approved' } : a));
      setMsg({ type: 'success', text: `Request #${approveId} approved.` });
      setApproveId(''); setApprovedBy('');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to approve.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Create Approval Request</h3></div>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Requested By *</label>
              <input className="form-input" value={form.requested_by} onChange={e => setFormField('requested_by', e.target.value)} placeholder="Username or user_id" />
            </div>
            <div className="form-group">
              <label className="form-label">Action Type *</label>
              <input className="form-input" value={form.action_type} onChange={e => setFormField('action_type', e.target.value)} placeholder="e.g. discount_override" />
            </div>
            <div className="form-group">
              <label className="form-label">Request Data (JSON)</label>
              <textarea className="form-textarea" value={form.request_data} onChange={e => setFormField('request_data', e.target.value)} placeholder='{"amount": 500}' />
            </div>
            <button className="btn btn-primary" disabled={loading}>Create Request</button>
          </form>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Approve a Request</h3></div>
          <form onSubmit={handleApprove}>
            <div className="form-group">
              <label className="form-label">Request ID</label>
              <input className="form-input" value={approveId} onChange={e => setApproveId(e.target.value)} placeholder="Approval Request ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Approved By</label>
              <input className="form-input" value={approvedBy} onChange={e => setApprovedBy(e.target.value)} placeholder="Approver username" />
            </div>
            <button className="btn btn-success" disabled={loading}>Approve Request</button>
          </form>
        </div>
      </div>
      {approvals.length > 0 && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Recent Requests (This Session)</h3></div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>ID</th><th>Requested By</th><th>Action Type</th><th>Status</th></tr></thead>
              <tbody>
                {approvals.map(a => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.requested_by}</td>
                    <td>{a.action_type}</td>
                    <td>
                      <span className={`badge ${a.status === 'approved' ? 'badge-green' : 'badge-yellow'}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Audit Logs Tab ───────────────────────────────────────────────────────────
function AuditLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getLogs();
      const data = res.data;
      setLogs(Array.isArray(data) ? data.slice(0, 100) : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Audit Logs (Recent 100)</h3>
          <button className="btn btn-secondary btn-sm" onClick={fetchLogs} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User ID</th>
                <th>Action</th>
                <th>Module</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
              )}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>No logs found</td></tr>
              )}
              {logs.map((log, i) => (
                <tr key={i}>
                  <td style={{ fontSize: '0.8rem' }}>{log.created_at || log.timestamp || '—'}</td>
                  <td>{log.user_id?.toString() || '—'}</td>
                  <td>{log.action || '—'}</td>
                  <td><span className="badge badge-blue">{log.module || '—'}</span></td>
                  <td>{log.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Departments Tab ──────────────────────────────────────────────────────────
function DepartmentsTab() {
  const [deptName, setDeptName] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [depts, setDepts] = useState([]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    setLoading(true);
    try {
      await createDepartment({ department_name: deptName });
      setDepts(prev => [...prev, { id: Date.now(), name: deptName }]);
      setMsg({ type: 'success', text: `Department "${deptName}" — event sent to HR service.` });
      setDeptName('');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to create department.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Create Department</h3></div>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Department Name</label>
              <input className="form-input" value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="e.g. Finance" />
            </div>
            <button className="btn btn-primary" disabled={loading}>Create Department</button>
          </form>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Created This Session</h3></div>
          {depts.length === 0 ? (
            <p className="text-muted">No departments created yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Department Name</th></tr></thead>
                <tbody>
                  {depts.map(d => <tr key={d.id}><td>{d.name}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminPanel ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState(0);

  const renderTab = () => {
    switch (activeTab) {
      case 0: return <RolesTab />;
      case 1: return <UsersTab />;
      case 2: return <ConfigTab />;
      case 3: return <FeatureFlagsTab />;
      case 4: return <ApprovalsTab />;
      case 5: return <AuditLogsTab />;
      case 6: return <DepartmentsTab />;
      default: return null;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Admin Panel</h2>
        <p className="text-muted text-sm">Manage roles, users, config, and system settings.</p>
      </div>
      <div className="tabs">
        {TABS.map((tab, i) => (
          <button key={i} className={`tab${activeTab === i ? ' active' : ''}`} onClick={() => setActiveTab(i)}>
            {tab}
          </button>
        ))}
      </div>
      {renderTab()}
    </div>
  );
}
