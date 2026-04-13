import { useState, useEffect, useMemo } from 'react';
import {
  createRole, assignPermission, createUser,
  getConfig, setConfig, setFeature,
  createApproval, approveRequest,
  getLogs, createDepartment, resetPassword
} from '../../api/admin.api';
import { confirmCriticalAction } from '../../lib/confirm';

// ─── All valid system permissions (from backend schema / seed data) ───────────
const SYSTEM_PERMISSIONS = [
  // POS / Sales
  { id: 'pos_view',            label: 'POS – View terminal' },
  { id: 'pos_create_sale',     label: 'POS – Create sale / transaction' },
  { id: 'pos_apply_discount',  label: 'POS – Apply discount' },
  { id: 'pos_void_sale',       label: 'POS – Void / cancel sale' },
  { id: 'pos_refund',          label: 'POS – Process refund' },
  // Inventory
  { id: 'inventory_view',      label: 'Inventory – View stock' },
  { id: 'inventory_create',    label: 'Inventory – Add product' },
  { id: 'inventory_update',    label: 'Inventory – Update product / stock' },
  { id: 'inventory_delete',    label: 'Inventory – Delete product' },
  { id: 'inventory_adjust',    label: 'Inventory – Manual stock adjustment' },
  // Procurement
  { id: 'procurement_view',    label: 'Procurement – View purchase orders' },
  { id: 'procurement_create',  label: 'Procurement – Create purchase order' },
  { id: 'procurement_approve', label: 'Procurement – Approve purchase order' },
  { id: 'procurement_receive', label: 'Procurement – Receive goods' },
  // HR
  { id: 'hr_view',             label: 'HR – View employees' },
  { id: 'hr_create',           label: 'HR – Add employee' },
  { id: 'hr_update',           label: 'HR – Update employee' },
  { id: 'hr_delete',           label: 'HR – Delete / deactivate employee' },
  { id: 'hr_payroll',          label: 'HR – Manage payroll' },
  { id: 'hr_attendance',       label: 'HR – Manage attendance' },
  { id: 'hr_leave',            label: 'HR – Manage leave requests' },
  // Analytics
  { id: 'analytics_view',      label: 'Analytics – View dashboards' },
  { id: 'analytics_export',    label: 'Analytics – Export reports' },
  // Admin
  { id: 'admin_users',         label: 'Admin – Manage users' },
  { id: 'admin_roles',         label: 'Admin – Manage roles & permissions' },
  { id: 'admin_config',        label: 'Admin – System configuration' },
  { id: 'admin_audit',         label: 'Admin – View audit logs' },
  { id: 'admin_approvals',     label: 'Admin – Manage approvals' },
  { id: 'admin_departments',   label: 'Admin – Manage departments' },
  { id: 'admin_features',      label: 'Admin – Feature flag management' },
  { id: 'admin_reset_pwd',     label: 'Admin – Reset user passwords' },
];

// Predefined roles with their IDs (matching backend seed)
const DEFAULT_ROLES = [
  { id: '1', name: 'admin' },
  { id: '2', name: 'cashier' },
  { id: '3', name: 'hr' },
  { id: '4', name: 'inventory' },
  { id: '5', name: 'procurement' },
  { id: '6', name: 'analyst' },
];

const TABS = [
  { key: 'roles',     icon: '🛡️',  label: 'Roles & Permissions' },
  { key: 'users',     icon: '👤',  label: 'Users' },
  { key: 'config',    icon: '⚙️',  label: 'Configuration' },
  { key: 'features',  icon: '🚩',  label: 'Feature Flags' },
  { key: 'approvals', icon: '✅',  label: 'Approvals' },
  { key: 'logs',      icon: '📋',  label: 'Audit Logs' },
  { key: 'depts',     icon: '🏢',  label: 'Departments' },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────
function useForm(initial) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const reset = () => setForm(initial);
  return [form, set, reset, setForm];
}

function Toast({ type, msg, onClose }) {
  if (!msg) return null;
  const colors = {
    success: { bg: 'rgba(16,185,129,0.12)', border: '#10b981', text: '#065f46', icon: '✓' },
    error:   { bg: 'rgba(239,68,68,0.10)',  border: '#ef4444', text: '#991b1b', icon: '✕' },
    info:    { bg: 'rgba(59,130,246,0.10)', border: '#3b82f6', text: '#1e40af', icon: 'ℹ' },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10,
      padding: '12px 16px', marginBottom: 16, color: c.text, fontSize: '0.875rem'
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{c.icon}</span>
        {msg}
      </span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text, fontWeight: 700, fontSize: '1rem', padding: '0 4px' }}>×</button>
    </div>
  );
}

function SectionCard({ title, subtitle, children, actions }) {
  return (
    <div className="adm-card">
      <div className="adm-card-header">
        <div>
          <p className="adm-card-title">{title}</p>
          {subtitle && <p className="adm-card-sub">{subtitle}</p>}
        </div>
        {actions && <div className="adm-card-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}{required && <span className="adm-required">*</span>}</label>
      {children}
      {hint && <p className="adm-hint">{hint}</p>}
    </div>
  );
}

function AdmInput({ ...props }) {
  return <input className="adm-input" {...props} />;
}

function AdmSelect({ children, ...props }) {
  return (
    <select className="adm-select" {...props}>
      {children}
    </select>
  );
}

function AdmBtn({ variant = 'primary', size = 'md', loading, children, ...props }) {
  return (
    <button className={`adm-btn adm-btn-${variant} adm-btn-${size}`} disabled={loading || props.disabled} {...props}>
      {loading ? <span className="adm-spinner" /> : null}
      {children}
    </button>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="adm-empty">
      <span className="adm-empty-icon">{icon}</span>
      <p>{text}</p>
    </div>
  );
}

// ─── Roles & Permissions Tab ──────────────────────────────────────────────────
function RolesTab() {
  const [roleName, setRoleName] = useState('');
  const [roleId, setRoleId]   = useState('');
  const [permId, setPermId]   = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState({ type: '', text: '' });
  const [roles, setRoles]     = useState(DEFAULT_ROLES);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) { setMsg({ type: 'error', text: 'Role name is required.' }); return; }
    setLoading(true);
    try {
      const res = await createRole({ role_name: roleName.trim() });
      const nr = res.data;
      setRoles(prev => [...prev, { id: nr.role_id?.toString() || Date.now().toString(), name: roleName.trim() }]);
      setMsg({ type: 'success', text: `Role "${roleName}" created.` });
      setRoleName('');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to create role.' });
    } finally { setLoading(false); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!roleId || !permId) { setMsg({ type: 'error', text: 'Select both a role and a permission.' }); return; }
    setLoading(true);
    try {
      await assignPermission({ role_id: parseInt(roleId), permission_id: permId });
      const roleName = roles.find(r => r.id === roleId)?.name || roleId;
      const permLabel = SYSTEM_PERMISSIONS.find(p => p.id === permId)?.label || permId;
      setMsg({ type: 'success', text: `"${permLabel}" assigned to role "${roleName}".` });
      setRoleId(''); setPermId('');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to assign permission.' });
    } finally { setLoading(false); }
  };

  // Group permissions by prefix
  const permGroups = useMemo(() => {
    const groups = {};
    SYSTEM_PERMISSIONS.forEach(p => {
      const prefix = p.id.split('_')[0];
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(p);
    });
    return groups;
  }, []);

  return (
    <div>
      <Toast type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="adm-grid-2">
        <SectionCard title="Create New Role" subtitle="Add a custom role to the system">
          <form onSubmit={handleCreateRole}>
            <Field label="Role Name" required hint="Use lowercase snake_case, e.g. store_manager">
              <AdmInput
                value={roleName}
                onChange={e => setRoleName(e.target.value)}
                placeholder="e.g. store_manager"
              />
            </Field>
            <AdmBtn type="submit" loading={loading}>Create Role</AdmBtn>
          </form>
        </SectionCard>

        <SectionCard title="Assign Permission to Role" subtitle="Grant a specific permission to an existing role">
          <form onSubmit={handleAssign}>
            <Field label="Select Role" required>
              <AdmSelect value={roleId} onChange={e => setRoleId(e.target.value)}>
                <option value="">— Choose a role —</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name} (ID: {r.id})</option>
                ))}
              </AdmSelect>
            </Field>
            <Field label="Select Permission" required hint="Permissions are grouped by module">
              <AdmSelect value={permId} onChange={e => setPermId(e.target.value)}>
                <option value="">— Choose a permission —</option>
                {Object.entries(permGroups).map(([group, perms]) => (
                  <optgroup key={group} label={group.toUpperCase()}>
                    {perms.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </optgroup>
                ))}
              </AdmSelect>
            </Field>
            <AdmBtn type="submit" loading={loading}>Assign Permission</AdmBtn>
          </form>
        </SectionCard>
      </div>

      <SectionCard title="Existing Roles" subtitle={`${roles.length} roles in the system`}>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>ID</th><th>Role Name</th><th>Status</th></tr>
            </thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id}>
                  <td><span className="adm-id-chip">#{r.id}</span></td>
                  <td><span className="adm-badge adm-badge-blue">{r.name}</span></td>
                  <td><span className="adm-badge adm-badge-green">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Available Permissions" subtitle="All permissions that can be assigned to roles">
        <div className="adm-perm-grid">
          {Object.entries(permGroups).map(([group, perms]) => (
            <div key={group} className="adm-perm-group">
              <p className="adm-perm-group-title">{group.toUpperCase()}</p>
              {perms.map(p => (
                <div key={p.id} className="adm-perm-item">
                  <code className="adm-code">{p.id}</code>
                  <span className="adm-perm-desc">{p.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [form, setFormField, resetForm] = useForm({
    username: '', email: '', password: '', confirm_password: '', role_id: '', employee_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState({ type: '', text: '' });
  const [roles]               = useState(DEFAULT_ROLES);
  const [resetEmpId, setResetEmpId] = useState('');
  const [resetMsg, setResetMsg]     = useState({ type: '', text: '' });
  const [resetLoading, setResetLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Username is required.';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required.';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match.';
    if (!form.role_id) e.role_id = 'A role must be selected.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role_id: parseInt(form.role_id),
      };
      if (form.employee_id) payload.employee_id = parseInt(form.employee_id);
      await createUser(payload);
      setMsg({ type: 'success', text: `User "${form.username}" created successfully.` });
      resetForm();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to create user.' });
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetEmpId.trim()) { setResetMsg({ type: 'error', text: 'Employee ID is required.' }); return; }
    if (!confirmCriticalAction(`Trigger password reset for employee ${resetEmpId}?`)) return;
    setResetLoading(true);
    try {
      await resetPassword({ employee_id: parseInt(resetEmpId) });
      setResetMsg({ type: 'success', text: `Password reset triggered for employee #${resetEmpId}.` });
      setResetEmpId('');
    } catch (err) {
      setResetMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to reset password.' });
    } finally { setResetLoading(false); }
  };

  return (
    <div>
      <Toast type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="adm-grid-2">
        <SectionCard title="Create User Account" subtitle="All starred fields are required">
          <form onSubmit={handleSubmit}>
            <Field label="Username" required>
              <AdmInput value={form.username} onChange={e => setFormField('username', e.target.value)} placeholder="johndoe" />
              {errors.username && <p className="adm-field-error">{errors.username}</p>}
            </Field>
            <Field label="Email Address" required>
              <AdmInput type="email" value={form.email} onChange={e => setFormField('email', e.target.value)} placeholder="john@smartmart.com" />
              {errors.email && <p className="adm-field-error">{errors.email}</p>}
            </Field>
            <Field label="Password" required>
              <AdmInput type="password" value={form.password} onChange={e => setFormField('password', e.target.value)} placeholder="Min. 6 characters" />
              {errors.password && <p className="adm-field-error">{errors.password}</p>}
            </Field>
            <Field label="Confirm Password" required>
              <AdmInput type="password" value={form.confirm_password} onChange={e => setFormField('confirm_password', e.target.value)} placeholder="Repeat password" />
              {errors.confirm_password && <p className="adm-field-error">{errors.confirm_password}</p>}
            </Field>
            <Field label="Assign Role" required hint="The user's access level will be determined by this role">
              <AdmSelect value={form.role_id} onChange={e => setFormField('role_id', e.target.value)}>
                <option value="">— Select a role —</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </AdmSelect>
              {errors.role_id && <p className="adm-field-error">{errors.role_id}</p>}
            </Field>
            <Field label="Employee ID" hint="Optional — links this login account to an employee record">
              <AdmInput value={form.employee_id} onChange={e => setFormField('employee_id', e.target.value)} placeholder="Employee ID (optional)" />
            </Field>
            <AdmBtn type="submit" loading={loading} style={{ width: '100%', marginTop: 4 }}>
              Create User Account
            </AdmBtn>
          </form>
        </SectionCard>

        <div>
          <SectionCard title="Password Reset" subtitle="Trigger a password reset event by Employee ID">
            <Toast type={resetMsg.type} msg={resetMsg.text} onClose={() => setResetMsg({ type: '', text: '' })} />
            <form onSubmit={handleReset}>
              <Field label="Employee ID" required hint="The associated AdminUser record will receive a reset event">
                <AdmInput
                  value={resetEmpId}
                  onChange={e => setResetEmpId(e.target.value)}
                  placeholder="e.g. 1042"
                  type="number"
                />
              </Field>
              <AdmBtn type="submit" variant="warning" loading={resetLoading} style={{ width: '100%' }}>
                🔑 Trigger Password Reset
              </AdmBtn>
            </form>
          </SectionCard>

          <SectionCard title="Roles Reference" subtitle="Use these role IDs when creating users" style={{ marginTop: 16 }}>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>ID</th><th>Role Name</th></tr></thead>
                <tbody>
                  {roles.map(r => (
                    <tr key={r.id}>
                      <td><span className="adm-id-chip">#{r.id}</span></td>
                      <td><span className="adm-badge adm-badge-blue">{r.name}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ─── Config Tab ───────────────────────────────────────────────────────────────
const CONFIG_KEYS = [
  { key: 'tax_rate',               label: 'Tax Rate (%)',              placeholder: '18' },
  { key: 'currency',               label: 'Currency Code',             placeholder: 'INR' },
  { key: 'store_name',             label: 'Store Name',                placeholder: 'SmartMart' },
  { key: 'max_discount_pct',       label: 'Max Discount (%)',          placeholder: '30' },
  { key: 'low_stock_threshold',    label: 'Low Stock Threshold (qty)', placeholder: '10' },
  { key: 'session_timeout_min',    label: 'Session Timeout (minutes)', placeholder: '60' },
  { key: 'po_approval_required',   label: 'PO Approval Required',      placeholder: 'true' },
  { key: 'loyalty_points_per_100', label: 'Loyalty Points per ₹100',   placeholder: '1' },
];

function ConfigTab() {
  const [configs, setConfigs]   = useState([]);
  const [form, setFormField, resetForm] = useForm({ config_key: '', config_value: '' });
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState({ type: '', text: '' });

  const fetchConfig = async () => {
    try {
      const res = await getConfig();
      const data = res.data;
      if (Array.isArray(data)) setConfigs(data);
      else if (data && typeof data === 'object') {
        setConfigs(Object.entries(data).map(([k, v]) => ({ config_key: k, config_value: v })));
      }
    } catch { setConfigs([]); }
  };

  useEffect(() => { fetchConfig(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.config_key || !form.config_value) {
      setMsg({ type: 'error', text: 'Both config key and value are required.' }); return;
    }
    setLoading(true);
    try {
      await setConfig({ config_key: form.config_key, config_value: form.config_value });
      setMsg({ type: 'success', text: `Config "${form.config_key}" saved / updated.` });
      resetForm(); fetchConfig();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to save config.' });
    } finally { setLoading(false); }
  };

  const quickFill = (key) => {
    const found = CONFIG_KEYS.find(c => c.key === key);
    setFormField('config_key', key);
    setFormField('config_value', found?.placeholder || '');
  };

  return (
    <div>
      <Toast type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="adm-grid-2">
        <SectionCard title="Set / Update Configuration" subtitle="Upserts a key-value pair in system_config">
          <form onSubmit={handleSubmit}>
            <Field label="Config Key" required hint="Select a preset or type a custom key">
              <AdmSelect
                value={form.config_key}
                onChange={e => { setFormField('config_key', e.target.value); quickFill(e.target.value); }}
                style={{ marginBottom: 6 }}
              >
                <option value="">— Choose a preset key —</option>
                {CONFIG_KEYS.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
                <option value="__custom">Custom key…</option>
              </AdmSelect>
              {(form.config_key === '__custom' || !CONFIG_KEYS.find(c => c.key === form.config_key)) && (
                <AdmInput
                  value={form.config_key === '__custom' ? '' : form.config_key}
                  onChange={e => setFormField('config_key', e.target.value)}
                  placeholder="custom_key_name"
                  style={{ marginTop: 6 }}
                />
              )}
            </Field>
            <Field label="Config Value" required>
              <AdmInput
                value={form.config_value}
                onChange={e => setFormField('config_value', e.target.value)}
                placeholder="Enter value"
              />
            </Field>
            <AdmBtn type="submit" loading={loading} style={{ width: '100%' }}>Save Configuration</AdmBtn>
          </form>

          <div style={{ marginTop: 16 }}>
            <p className="adm-label" style={{ marginBottom: 8 }}>Quick-fill presets</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CONFIG_KEYS.map(c => (
                <button key={c.key} className="adm-chip" onClick={() => quickFill(c.key)}>{c.label}</button>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Current Configuration"
          subtitle={`${configs.length} key(s) stored`}
          actions={<AdmBtn variant="ghost" size="sm" onClick={fetchConfig}>↻ Refresh</AdmBtn>}
        >
          {configs.length === 0 ? (
            <EmptyState icon="⚙️" text="No configuration found. Add your first key above." />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Key</th><th>Value</th></tr></thead>
                <tbody>
                  {configs.map((c, i) => (
                    <tr key={i}>
                      <td><code className="adm-code">{c.config_key}</code></td>
                      <td className="adm-mono">{c.config_value?.toString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Feature Flags Tab ────────────────────────────────────────────────────────
const DEFAULT_FEATURES = [
  { feature_name: 'online_payments',      is_enabled: true  },
  { feature_name: 'loyalty_program',      is_enabled: false },
  { feature_name: 'email_notifications',  is_enabled: true  },
  { feature_name: 'auto_reorder',         is_enabled: false },
  { feature_name: 'analytics_dashboard',  is_enabled: true  },
  { feature_name: 'pos_offline_mode',     is_enabled: false },
  { feature_name: 'multi_currency',       is_enabled: false },
];

function FeatureFlagsTab() {
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [newFeature, setNewFeature] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleToggle = async (idx) => {
    const feat = features[idx];
    const newVal = !feat.is_enabled;
    if (!confirmCriticalAction(`${newVal ? 'Enable' : 'Disable'} "${feat.feature_name}"?`)) return;
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
    if (!/^[a-z0-9_]+$/.test(newFeature)) {
      setMsg({ type: 'error', text: 'Feature name must be lowercase snake_case (a-z, 0-9, _).' }); return;
    }
    try {
      await setFeature({ feature_name: newFeature, is_enabled: true });
      setFeatures(prev => [...prev, { feature_name: newFeature, is_enabled: true }]);
      setMsg({ type: 'success', text: `Feature "${newFeature}" added and enabled.` });
      setNewFeature('');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to add feature.' });
    }
  };

  const enabled = features.filter(f => f.is_enabled).length;

  return (
    <div>
      <Toast type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="adm-flag-stats">
        <div className="adm-flag-stat adm-flag-stat-blue">
          <span className="adm-flag-stat-val">{features.length}</span>
          <span className="adm-flag-stat-label">Total Flags</span>
        </div>
        <div className="adm-flag-stat adm-flag-stat-green">
          <span className="adm-flag-stat-val">{enabled}</span>
          <span className="adm-flag-stat-label">Enabled</span>
        </div>
        <div className="adm-flag-stat adm-flag-stat-red">
          <span className="adm-flag-stat-val">{features.length - enabled}</span>
          <span className="adm-flag-stat-label">Disabled</span>
        </div>
      </div>

      <SectionCard title="Add Feature Flag" subtitle="Use snake_case for the feature name">
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <AdmInput value={newFeature} onChange={e => setNewFeature(e.target.value)} placeholder="e.g. dark_mode_ui" />
          </div>
          <AdmBtn type="submit">Add Flag</AdmBtn>
        </form>
      </SectionCard>

      <SectionCard title="Feature Flags" subtitle="Toggle to enable or disable system features">
        <div className="adm-feature-list">
          {features.map((f, i) => (
            <div key={i} className={`adm-feature-row ${f.is_enabled ? 'enabled' : 'disabled'}`}>
              <div className="adm-feature-info">
                <code className="adm-code">{f.feature_name}</code>
                <span className={`adm-badge ${f.is_enabled ? 'adm-badge-green' : 'adm-badge-red'}`}>
                  {f.is_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <label className="adm-toggle">
                <input type="checkbox" checked={f.is_enabled} onChange={() => handleToggle(i)} />
                <span className="adm-toggle-slider" />
              </label>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Approvals Tab ────────────────────────────────────────────────────────────
const ACTION_TYPES = [
  'discount_override',
  'price_adjustment',
  'stock_write_off',
  'po_bulk_approve',
  'refund_override',
  'config_change',
  'user_role_change',
  'payroll_adjustment',
  'system_maintenance',
];

function ApprovalsTab() {
  const [form, setFormField, resetForm] = useForm({ requested_by: '', action_type: '', request_data: '' });
  const [approvals, setApprovals]       = useState([
    { id: '1001', requested_by: '3', action_type: 'discount_override', status: 'PENDING', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '1002', requested_by: '5', action_type: 'stock_write_off',   status: 'PENDING', created_at: new Date(Date.now() - 7200000).toISOString() },
  ]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState({ type: '', text: '' });
  const [filter, setFilter]   = useState('ALL');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.requested_by || !form.action_type) {
      setMsg({ type: 'error', text: 'Requested By and Action Type are both required.' }); return;
    }
    setLoading(true);
    try {
      let reqData = form.request_data;
      if (reqData) { try { reqData = JSON.parse(reqData); } catch { /* keep string */ } }
      const res = await createApproval({ requested_by: form.requested_by, action_type: form.action_type, request_data: reqData });
      const created = res.data;
      setApprovals(prev => [...prev, {
        id: created.request_id?.toString() || Date.now().toString(),
        requested_by: form.requested_by,
        action_type: form.action_type,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      }]);
      setMsg({ type: 'success', text: 'Approval request created.' });
      resetForm();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to create approval.' });
    } finally { setLoading(false); }
  };

  const handleApprove = async (approval) => {
    if (!confirmCriticalAction(`Approve request #${approval.id} (${approval.action_type})?`)) return;
    setLoading(true);
    try {
      await approveRequest(approval.id, { approved_by: 'admin' });
      setApprovals(prev => prev.map(a => a.id === approval.id ? { ...a, status: 'APPROVED' } : a));
      setMsg({ type: 'success', text: `Request #${approval.id} approved.` });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to approve.' });
    } finally { setLoading(false); }
  };

  const handleReject = (approval) => {
    if (!confirmCriticalAction(`Reject request #${approval.id}? This cannot be undone.`)) return;
    setApprovals(prev => prev.map(a => a.id === approval.id ? { ...a, status: 'REJECTED' } : a));
    setMsg({ type: 'info', text: `Request #${approval.id} rejected.` });
  };

  const filtered = filter === 'ALL' ? approvals : approvals.filter(a => a.status === filter);
  const pending  = approvals.filter(a => a.status === 'PENDING').length;

  return (
    <div>
      <Toast type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="adm-grid-2">
        <SectionCard title="Create Approval Request" subtitle="Submit a new request for admin approval">
          <form onSubmit={handleCreate}>
            <Field label="Requested By (User ID)" required>
              <AdmInput value={form.requested_by} onChange={e => setFormField('requested_by', e.target.value)} placeholder="e.g. 3" type="number" />
            </Field>
            <Field label="Action Type" required hint="Select the type of action requiring approval">
              <AdmSelect value={form.action_type} onChange={e => setFormField('action_type', e.target.value)}>
                <option value="">— Select action type —</option>
                {ACTION_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </AdmSelect>
            </Field>
            <Field label="Request Data (JSON)" hint="Optional — provide additional context as JSON">
              <textarea className="adm-textarea" value={form.request_data} onChange={e => setFormField('request_data', e.target.value)} placeholder='{"amount": 500, "reason": "seasonal promo"}' />
            </Field>
            <AdmBtn type="submit" loading={loading} style={{ width: '100%' }}>Submit Request</AdmBtn>
          </form>
        </SectionCard>

        <SectionCard title="Pending Summary">
          <div className="adm-approval-stats">
            <div className="adm-appr-stat">
              <span className="adm-appr-val adm-appr-yellow">{pending}</span>
              <span className="adm-appr-label">Pending Review</span>
            </div>
            <div className="adm-appr-stat">
              <span className="adm-appr-val adm-appr-green">{approvals.filter(a => a.status === 'APPROVED').length}</span>
              <span className="adm-appr-label">Approved</span>
            </div>
            <div className="adm-appr-stat">
              <span className="adm-appr-val adm-appr-red">{approvals.filter(a => a.status === 'REJECTED').length}</span>
              <span className="adm-appr-label">Rejected</span>
            </div>
          </div>

          {pending > 0 && (
            <div className="adm-pending-list">
              <p className="adm-label" style={{ marginBottom: 8 }}>Pending Requests</p>
              {approvals.filter(a => a.status === 'PENDING').map(a => (
                <div key={a.id} className="adm-pending-item">
                  <div>
                    <p className="adm-pending-action">{a.action_type.replace(/_/g, ' ')}</p>
                    <p className="adm-pending-meta">By user #{a.requested_by} · #{a.id}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <AdmBtn size="sm" variant="success" onClick={() => handleApprove(a)} loading={loading}>✓</AdmBtn>
                    <AdmBtn size="sm" variant="danger"  onClick={() => handleReject(a)}>✕</AdmBtn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="All Approval Requests"
        subtitle={`${approvals.length} total`}
        actions={
          <div style={{ display: 'flex', gap: 6 }}>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
              <button key={s} className={`adm-filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s}</button>
            ))}
          </div>
        }
      >
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>ID</th><th>Requested By</th><th>Action Type</th><th>Status</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0' }}>No requests found</td></tr>
              )}
              {filtered.map(a => (
                <tr key={a.id}>
                  <td><span className="adm-id-chip">#{a.id}</span></td>
                  <td>User #{a.requested_by}</td>
                  <td><code className="adm-code">{a.action_type}</code></td>
                  <td>
                    <span className={`adm-badge ${a.status === 'APPROVED' ? 'adm-badge-green' : a.status === 'REJECTED' ? 'adm-badge-red' : 'adm-badge-yellow'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="adm-mono" style={{ fontSize: '0.78rem' }}>{a.created_at ? new Date(a.created_at).toLocaleString() : '—'}</td>
                  <td>
                    {a.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <AdmBtn size="sm" variant="success" onClick={() => handleApprove(a)} loading={loading}>Approve</AdmBtn>
                        <AdmBtn size="sm" variant="danger" onClick={() => handleReject(a)}>Reject</AdmBtn>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Audit Logs Tab ───────────────────────────────────────────────────────────
function AuditLogsTab() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [sortDir, setSortDir] = useState('desc');

  const fetchLogs = async () => {
    setLoading(true); setError('');
    try {
      const res = await getLogs();
      const data = res.data;
      setLogs(Array.isArray(data) ? data.slice(0, 200) : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch audit logs.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  const modules = useMemo(() => [...new Set(logs.map(l => l.module).filter(Boolean))], [logs]);

  const filtered = useMemo(() => {
    let result = logs;
    if (moduleFilter) result = result.filter(l => l.module === moduleFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        (l.action || '').toLowerCase().includes(q) ||
        (l.user_id?.toString() || '').includes(q) ||
        (l.ip_address || '').includes(q)
      );
    }
    if (sortDir === 'asc') result = [...result].reverse();
    return result;
  }, [logs, moduleFilter, search, sortDir]);

  return (
    <div>
      {error && <Toast type="error" msg={error} onClose={() => setError('')} />}
      <SectionCard
        title="Audit Logs"
        subtitle={`Showing ${filtered.length} of ${logs.length} entries`}
        actions={<AdmBtn variant="ghost" size="sm" onClick={fetchLogs} loading={loading}>↻ Refresh</AdmBtn>}
      >
        <div className="adm-log-filters">
          <AdmInput value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search action, user, IP…" style={{ flex: 1 }} />
          <AdmSelect value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} style={{ minWidth: 150 }}>
            <option value="">All Modules</option>
            {modules.map(m => <option key={m} value={m}>{m}</option>)}
          </AdmSelect>
          <AdmBtn
            variant="ghost"
            size="sm"
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
          >
            {sortDir === 'desc' ? '↓ Newest' : '↑ Oldest'}
          </AdmBtn>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
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
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                  <span className="adm-spinner" style={{ display: 'inline-block' }} />
                  {' '}Loading logs…
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                  No audit logs found
                </td></tr>
              )}
              {filtered.map((log, i) => {
                const ts = log.timestamp || log.created_at;
                return (
                  <tr key={i}>
                    <td className="adm-mono" style={{ fontSize: '0.78rem' }}>{ts ? new Date(ts).toLocaleString() : '—'}</td>
                    <td>{log.user_id?.toString() || '—'}</td>
                    <td style={{ maxWidth: 200 }}>{log.action || '—'}</td>
                    <td>{log.module ? <span className="adm-badge adm-badge-blue">{log.module}</span> : '—'}</td>
                    <td className="adm-mono">{log.ip_address || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Departments Tab ──────────────────────────────────────────────────────────
const DEPT_ICONS = {
  Finance: '💰', HR: '👥', IT: '💻', Operations: '⚙️',
  Sales: '📈', Marketing: '📣', Procurement: '📦', Security: '🔒',
};

const PRESET_DEPTS = ['Finance', 'HR', 'IT', 'Operations', 'Sales', 'Marketing', 'Procurement', 'Security'];

function DepartmentsTab() {
  const [deptName, setDeptName]   = useState('');
  const [location, setLocation]   = useState('');
  const [managerId, setManagerId] = useState('');
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState({ type: '', text: '' });
  const [depts, setDepts]         = useState([]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!deptName.trim()) { setMsg({ type: 'error', text: 'Department name is required.' }); return; }
    setLoading(true);
    try {
      const payload = { department_name: deptName.trim() };
      if (location.trim()) payload.location = location.trim();
      if (managerId.trim()) payload.manager_id = parseInt(managerId);
      await createDepartment(payload);
      setDepts(prev => [...prev, { id: Date.now(), name: deptName.trim(), location: location.trim(), manager_id: managerId }]);
      setMsg({ type: 'success', text: `Department "${deptName}" created and event sent to HR service.` });
      setDeptName(''); setLocation(''); setManagerId('');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to create department.' });
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Toast type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="adm-grid-2">
        <SectionCard title="Create Department" subtitle="Publishes a department.created event to the HR service">
          <form onSubmit={handleCreate}>
            <Field label="Department Name" required hint="Choose a preset or type a custom name">
              <AdmSelect value={deptName} onChange={e => setDeptName(e.target.value)} style={{ marginBottom: 6 }}>
                <option value="">— Choose preset —</option>
                {PRESET_DEPTS.map(d => <option key={d} value={d}>{DEPT_ICONS[d] || ''} {d}</option>)}
                <option value="__custom">Custom…</option>
              </AdmSelect>
              {(deptName === '__custom' || !PRESET_DEPTS.includes(deptName)) && (
                <AdmInput value={deptName === '__custom' ? '' : deptName} onChange={e => setDeptName(e.target.value)} placeholder="e.g. Legal" style={{ marginTop: 6 }} />
              )}
            </Field>
            <Field label="Location" hint="Optional — office location or branch">
              <AdmInput value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Head Office, Chennai" />
            </Field>
            <Field label="Manager Employee ID" hint="Optional — assign a manager to this department">
              <AdmInput value={managerId} onChange={e => setManagerId(e.target.value)} placeholder="e.g. 1042" type="number" />
            </Field>
            <AdmBtn type="submit" loading={loading} style={{ width: '100%' }}>Create Department</AdmBtn>
          </form>

          <div style={{ marginTop: 16 }}>
            <p className="adm-label" style={{ marginBottom: 8 }}>Quick-select department</p>
            <div className="adm-dept-presets">
              {PRESET_DEPTS.map(d => (
                <button key={d} className="adm-dept-preset-btn" onClick={() => setDeptName(d)}>
                  {DEPT_ICONS[d]} {d}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Created This Session" subtitle={`${depts.length} department(s)`}>
          {depts.length === 0 ? (
            <EmptyState icon="🏢" text="No departments created yet in this session." />
          ) : (
            <div className="adm-dept-list">
              {depts.map(d => (
                <div key={d.id} className="adm-dept-item">
                  <span className="adm-dept-icon">{DEPT_ICONS[d.name] || '🏢'}</span>
                  <div>
                    <p className="adm-dept-name">{d.name}</p>
                    {d.location && <p className="adm-dept-meta">📍 {d.location}</p>}
                    {d.manager_id && <p className="adm-dept-meta">👤 Manager #{d.manager_id}</p>}
                  </div>
                  <span className="adm-badge adm-badge-green">Created</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
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
    <div className="adm-root">
      <div className="adm-hero">
        <div>
          <h1 className="adm-hero-title">Admin Panel</h1>
          <p className="adm-hero-sub">Manage roles, users, configuration, approvals, and system settings.</p>
        </div>
        <div className="adm-hero-badge">
          <span>🛡️</span> System Admin
        </div>
      </div>

      <div className="adm-tabs">
        {TABS.map((tab, i) => (
          <button
            key={tab.key}
            className={`adm-tab ${activeTab === i ? 'adm-tab-active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            <span className="adm-tab-icon">{tab.icon}</span>
            <span className="adm-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="adm-content">
        {renderTab()}
      </div>
    </div>
  );
}
