import { useState, useEffect } from 'react';
import {
  createEmployee, getEmployees, updateEmployee, updateEmployeeStatus,
  getDepartments, createHRDepartment, assignDepartment, assignManager,
  checkIn, checkOut, getAttendance,
  applyLeave, updateLeave, getLeaves, getLeaveBalance,
  generatePayroll, getPayroll, getPayslip
} from '../../api/hr.api';
import { confirmCriticalAction } from '../../lib/confirm';

const TABS = ['Employees', 'Departments', 'Attendance', 'Leave', 'Payroll'];

function Alert({ type, msg, onClose }) {
  if (!msg) return null;
  return (
    <div className={`alert alert-${type}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>✕</button>
    </div>
  );
}

// ─── Employees Tab ────────────────────────────────────────────────────────────
function EmployeesTab() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    role: '', salary: '', password: '', allowed_leaves: '12'
  });
  const [statusId, setStatusId] = useState('');
  const [newStatus, setNewStatus] = useState('Active');

  const fetchEmployees = async () => {
    try {
      const res = await getEmployees();
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch {
      setEmployees([]);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const required = ['first_name', 'last_name', 'email', 'phone', 'role', 'salary', 'password'];
    if (required.some(k => !form[k])) {
      setMsg({ type: 'error', text: 'All required fields must be filled.' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        salary: parseFloat(form.salary),
        allowed_leaves: parseInt(form.allowed_leaves) || 12,
      };
      await createEmployee(payload);
      setMsg({ type: 'success', text: `Employee ${form.first_name} ${form.last_name} created.` });
      setForm({ first_name: '', last_name: '', email: '', phone: '', role: '', salary: '', password: '', allowed_leaves: '12' });
      fetchEmployees();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to create employee.' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!statusId) return;
    if (!confirmCriticalAction(`Change employee ${statusId} status to ${newStatus}?`)) return;
    setLoading(true);
    try {
      await updateEmployeeStatus(statusId, { status: newStatus });
      setMsg({ type: 'success', text: `Employee ${statusId} status set to ${newStatus}.` });
      setStatusId('');
      fetchEmployees();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to update status.' });
    } finally {
      setLoading(false);
    }
  };

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="card">
        <div className="card-header"><h3 className="card-title">Create Employee</h3></div>
        <form onSubmit={handleCreate}>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-input" value={form.first_name} onChange={e => setField('first_name', e.target.value)} placeholder="First name" />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className="form-input" value={form.last_name} onChange={e => setField('last_name', e.target.value)} placeholder="Last name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="Email" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input className="form-input" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="Phone" />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <input className="form-input" value={form.role} onChange={e => setField('role', e.target.value)} placeholder="e.g. cashier, hr" />
            </div>
            <div className="form-group">
              <label className="form-label">Salary (₹) *</label>
              <input className="form-input" type="number" value={form.salary} onChange={e => setField('salary', e.target.value)} placeholder="Monthly salary" />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" value={form.password} onChange={e => setField('password', e.target.value)} placeholder="Initial password" />
            </div>
            <div className="form-group">
              <label className="form-label">Allowed Leaves/Year</label>
              <input className="form-input" type="number" value={form.allowed_leaves} onChange={e => setField('allowed_leaves', e.target.value)} placeholder="12" />
            </div>
          </div>
          <button className="btn btn-primary" disabled={loading}>Create Employee</button>
        </form>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Update Employee Status</h3></div>
          <form onSubmit={handleStatusUpdate}>
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input className="form-input" value={statusId} onChange={e => setStatusId(e.target.value)} placeholder="Employee ID" />
            </div>
            <div className="form-group">
              <label className="form-label">New Status</label>
              <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <button className="btn btn-warning" disabled={loading}>Update Status</button>
          </form>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Employee List</h3>
            <button className="btn btn-secondary btn-sm" onClick={fetchEmployees}>Refresh</button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Status</th></tr></thead>
              <tbody>
                {employees.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>No employees found</td></tr>}
                {employees.map((emp, i) => (
                  <tr key={i}>
                    <td>{emp.employee_id?.toString() || emp.id?.toString()}</td>
                    <td>{emp.first_name} {emp.last_name}</td>
                    <td>{emp.role}</td>
                    <td><span className={`badge ${emp.status === 'Active' ? 'badge-green' : 'badge-red'}`}>{emp.status || 'Active'}</span></td>
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

// ─── Departments Tab ──────────────────────────────────────────────────────────
function DepartmentsTab() {
  const [departments, setDepartments] = useState([]);
  const [deptName, setDeptName] = useState('');
  const [empDeptId, setEmpDeptId] = useState('');
  const [empDeptVal, setEmpDeptVal] = useState('');
  const [managerDeptId, setManagerDeptId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchDepts = async () => {
    try {
      const res = await getDepartments();
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDepartments([]);
    }
  };

  useEffect(() => { fetchDepts(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!deptName) return;
    setLoading(true);
    try {
      await createHRDepartment({ department_name: deptName });
      setMsg({ type: 'success', text: `Department "${deptName}" created.` });
      setDeptName('');
      fetchDepts();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDept = async (e) => {
    e.preventDefault();
    if (!empDeptId || !empDeptVal) return;
    setLoading(true);
    try {
      await assignDepartment(empDeptId, { department_id: empDeptVal });
      setMsg({ type: 'success', text: `Employee ${empDeptId} assigned to department ${empDeptVal}.` });
      setEmpDeptId(''); setEmpDeptVal('');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignManager = async (e) => {
    e.preventDefault();
    if (!managerDeptId || !managerId) return;
    setLoading(true);
    try {
      await assignManager(managerDeptId, { manager_id: managerId });
      setMsg({ type: 'success', text: `Manager ${managerId} assigned to dept ${managerDeptId}.` });
      setManagerDeptId(''); setManagerId('');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="grid-3">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Create Department</h3></div>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Department Name</label>
              <input className="form-input" value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="e.g. Finance" />
            </div>
            <button className="btn btn-primary" disabled={loading}>Create</button>
          </form>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Assign Employee to Dept</h3></div>
          <form onSubmit={handleAssignDept}>
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input className="form-input" value={empDeptId} onChange={e => setEmpDeptId(e.target.value)} placeholder="Employee ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Department ID</label>
              <input className="form-input" value={empDeptVal} onChange={e => setEmpDeptVal(e.target.value)} placeholder="Department ID" />
            </div>
            <button className="btn btn-primary" disabled={loading}>Assign</button>
          </form>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Assign Manager</h3></div>
          <form onSubmit={handleAssignManager}>
            <div className="form-group">
              <label className="form-label">Department ID</label>
              <input className="form-input" value={managerDeptId} onChange={e => setManagerDeptId(e.target.value)} placeholder="Department ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Manager Employee ID</label>
              <input className="form-input" value={managerId} onChange={e => setManagerId(e.target.value)} placeholder="Manager ID" />
            </div>
            <button className="btn btn-primary" disabled={loading}>Assign</button>
          </form>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Departments</h3>
          <button className="btn btn-secondary btn-sm" onClick={fetchDepts}>Refresh</button>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>ID</th><th>Name</th><th>Manager</th></tr></thead>
            <tbody>
              {departments.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8' }}>No departments</td></tr>}
              {departments.map((d, i) => (
                <tr key={i}>
                  <td>{d.department_id?.toString() || d.id?.toString()}</td>
                  <td>{d.department_name || d.name}</td>
                  <td>{d.manager_name || d.manager_id?.toString() || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Attendance Tab ───────────────────────────────────────────────────────────
function AttendanceTab() {
  const [checkInId, setCheckInId] = useState('');
  const [checkOutId, setCheckOutId] = useState('');
  const [viewId, setViewId] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInId) return;
    setLoading(true);
    try {
      const res = await checkIn({ employee_id: checkInId });
      setMsg({ type: 'success', text: `Check-in recorded for employee ${checkInId}. Time: ${res.data.check_in_time || 'now'}` });
      setCheckInId('');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Check-in failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (e) => {
    e.preventDefault();
    if (!checkOutId) return;
    setLoading(true);
    try {
      const res = await checkOut({ employee_id: checkOutId });
      setMsg({ type: 'success', text: `Check-out recorded for employee ${checkOutId}.` });
      setCheckOutId('');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Check-out failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewAttendance = async (e) => {
    e.preventDefault();
    if (!viewId) return;
    setLoading(true);
    try {
      const res = await getAttendance(viewId);
      setAttendance(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to fetch attendance.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Check In</h3></div>
          <form onSubmit={handleCheckIn}>
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input className="form-input" value={checkInId} onChange={e => setCheckInId(e.target.value)} placeholder="Employee ID" />
            </div>
            <button className="btn btn-success" disabled={loading}>Check In</button>
          </form>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Check Out</h3></div>
          <form onSubmit={handleCheckOut}>
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input className="form-input" value={checkOutId} onChange={e => setCheckOutId(e.target.value)} placeholder="Employee ID" />
            </div>
            <button className="btn btn-warning" disabled={loading}>Check Out</button>
          </form>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h3 className="card-title">View Attendance</h3></div>
        <form onSubmit={handleViewAttendance} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input className="form-input" value={viewId} onChange={e => setViewId(e.target.value)} placeholder="Employee ID" style={{ flex: 1 }} />
          <button className="btn btn-primary" disabled={loading}>Fetch</button>
        </form>
        {attendance.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
              <tbody>
                {attendance.map((a, i) => (
                  <tr key={i}>
                    <td>{a.date || a.attendance_date || '—'}</td>
                    <td>{a.check_in_time || '—'}</td>
                    <td>{a.check_out_time || '—'}</td>
                    <td><span className={`badge ${a.status === 'present' ? 'badge-green' : 'badge-red'}`}>{a.status || 'present'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Leave Tab ────────────────────────────────────────────────────────────────
function LeaveTab() {
  const [applyForm, setApplyForm] = useState({ employee_id: '', leave_type: 'Annual', start_date: '', end_date: '', reason: '' });
  const [viewId, setViewId] = useState('');
  const [leaves, setLeaves] = useState([]);
  const [leaveId, setLeaveId] = useState('');
  const [leaveStatus, setLeaveStatus] = useState('Approved');
  const [balanceId, setBalanceId] = useState('');
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const setApplyField = (k, v) => setApplyForm(f => ({ ...f, [k]: v }));

  const handleApply = async (e) => {
    e.preventDefault();
    const { employee_id, leave_type, start_date, end_date, reason } = applyForm;
    if (!employee_id || !start_date || !end_date || !reason) {
      setMsg({ type: 'error', text: 'All fields required.' });
      return;
    }
    setLoading(true);
    try {
      const res = await applyLeave({ employee_id, leave_type, start_date, end_date, reason });
      setMsg({ type: 'success', text: `Leave applied. ID: ${res.data.leave_id?.toString() || 'Done'}` });
      setApplyForm({ employee_id: '', leave_type: 'Annual', start_date: '', end_date: '', reason: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to apply leave.' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewLeaves = async (e) => {
    e.preventDefault();
    if (!viewId) return;
    setLoading(true);
    try {
      const res = await getLeaves(viewId);
      setLeaves(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLeave = async (e) => {
    e.preventDefault();
    if (!leaveId) return;
    if (!confirmCriticalAction(`${leaveStatus} leave request ${leaveId}?`)) return;
    setLoading(true);
    try {
      await updateLeave(leaveId, { status: leaveStatus });
      setMsg({ type: 'success', text: `Leave #${leaveId} ${leaveStatus}.` });
      setLeaveId('');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleBalance = async (e) => {
    e.preventDefault();
    if (!balanceId) return;
    setLoading(true);
    try {
      const res = await getLeaveBalance(balanceId);
      setBalance(res.data);
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Apply Leave</h3></div>
          <form onSubmit={handleApply}>
            <div className="form-group">
              <label className="form-label">Employee ID *</label>
              <input className="form-input" value={applyForm.employee_id} onChange={e => setApplyField('employee_id', e.target.value)} placeholder="Employee ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Leave Type</label>
              <select className="form-select" value={applyForm.leave_type} onChange={e => setApplyField('leave_type', e.target.value)}>
                <option value="Annual">Annual</option>
                <option value="Sick">Sick</option>
                <option value="Casual">Casual</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input className="form-input" type="date" value={applyForm.start_date} onChange={e => setApplyField('start_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input className="form-input" type="date" value={applyForm.end_date} onChange={e => setApplyField('end_date', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Reason *</label>
              <textarea className="form-textarea" value={applyForm.reason} onChange={e => setApplyField('reason', e.target.value)} placeholder="Reason for leave..." />
            </div>
            <button className="btn btn-primary" disabled={loading}>Apply Leave</button>
          </form>
        </div>

        <div>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Approve / Reject Leave</h3></div>
            <form onSubmit={handleUpdateLeave}>
              <div className="form-group">
                <label className="form-label">Leave ID</label>
                <input className="form-input" value={leaveId} onChange={e => setLeaveId(e.target.value)} placeholder="Leave ID" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={leaveStatus} onChange={e => setLeaveStatus(e.target.value)}>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <button className={`btn ${leaveStatus === 'Approved' ? 'btn-success' : 'btn-danger'}`} disabled={loading}>Update Leave</button>
            </form>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Leave Balance</h3></div>
            <form onSubmit={handleBalance} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <input className="form-input" value={balanceId} onChange={e => setBalanceId(e.target.value)} placeholder="Employee ID" style={{ flex: 1 }} />
              <button className="btn btn-primary" disabled={loading}>Check</button>
            </form>
            {balance && (
              <div>
                <div className="stat-row"><span className="text-muted">Allowed</span><span className="fw-600">{balance.allowed_leaves || balance.total}</span></div>
                <div className="stat-row"><span className="text-muted">Used</span><span>{balance.used_leaves || balance.used}</span></div>
                <div className="stat-row"><span className="text-muted">Remaining</span><span style={{ color: '#10b981', fontWeight: 700 }}>{balance.remaining_leaves || balance.remaining}</span></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">View Leaves</h3></div>
        <form onSubmit={handleViewLeaves} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input className="form-input" value={viewId} onChange={e => setViewId(e.target.value)} placeholder="Employee ID" style={{ flex: 1 }} />
          <button className="btn btn-primary" disabled={loading}>Fetch Leaves</button>
        </form>
        {leaves.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Leave ID</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {leaves.map((l, i) => (
                  <tr key={i}>
                    <td>{l.leave_id?.toString() || l.id?.toString()}</td>
                    <td>{l.leave_type}</td>
                    <td>{l.start_date}</td>
                    <td>{l.end_date}</td>
                    <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.reason}</td>
                    <td>
                      <span className={`badge ${l.status === 'Approved' ? 'badge-green' : l.status === 'Rejected' ? 'badge-red' : 'badge-yellow'}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Payroll Tab ──────────────────────────────────────────────────────────────
function PayrollTab() {
  const [genForm, setGenForm] = useState({ employee_id: '', month: '', year: '', bonus: '' });
  const [viewId, setViewId] = useState('');
  const [payroll, setPayroll] = useState([]);
  const [payslipId, setPayslipId] = useState('');
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const setGen = (k, v) => setGenForm(f => ({ ...f, [k]: v }));

  const handleGenerate = async (e) => {
    e.preventDefault();
    const { employee_id, month, year } = genForm;
    if (!employee_id || !month || !year) {
      setMsg({ type: 'error', text: 'employee_id, month, and year required.' });
      return;
    }
    if (!confirmCriticalAction(`Generate payroll for employee ${employee_id} for ${month}/${year}?`)) return;
    setLoading(true);
    try {
      const payload = { employee_id, month: parseInt(month), year: parseInt(year) };
      if (genForm.bonus) payload.bonus = parseFloat(genForm.bonus);
      const res = await generatePayroll(payload);
      setMsg({ type: 'success', text: `Payroll generated. ID: ${res.data.payroll_id?.toString() || 'Done'}` });
      setGenForm({ employee_id: '', month: '', year: '', bonus: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to generate payroll.' });
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (e) => {
    e.preventDefault();
    if (!viewId) return;
    setLoading(true);
    try {
      const res = await getPayroll(viewId);
      setPayroll(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePayslip = async (e) => {
    e.preventDefault();
    if (!payslipId) return;
    setLoading(true);
    setPayslip(null);
    try {
      const res = await getPayslip(payslipId);
      setPayslip(res.data);
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to fetch payslip.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Generate Payroll</h3></div>
          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label className="form-label">Employee ID *</label>
              <input className="form-input" value={genForm.employee_id} onChange={e => setGen('employee_id', e.target.value)} placeholder="Employee ID" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Month (1–12) *</label>
                <input className="form-input" type="number" min="1" max="12" value={genForm.month} onChange={e => setGen('month', e.target.value)} placeholder="Month" />
              </div>
              <div className="form-group">
                <label className="form-label">Year *</label>
                <input className="form-input" type="number" min="2020" value={genForm.year} onChange={e => setGen('year', e.target.value)} placeholder="2024" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Bonus (₹)</label>
              <input className="form-input" type="number" value={genForm.bonus} onChange={e => setGen('bonus', e.target.value)} placeholder="Optional bonus" />
            </div>
            <button className="btn btn-success" disabled={loading}>Generate Payroll</button>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">View Payslip</h3></div>
          <form onSubmit={handlePayslip} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input className="form-input" value={payslipId} onChange={e => setPayslipId(e.target.value)} placeholder="Payroll ID" style={{ flex: 1 }} />
            <button className="btn btn-primary" disabled={loading}>Get Payslip</button>
          </form>
          {payslip && (
            <div className="payslip-box">
              <h4 className="fw-600 mb-3">Payslip Details</h4>
              <div className="payslip-row"><span>Employee ID</span><span>{payslip.employee_id?.toString()}</span></div>
              <div className="payslip-row"><span>Period</span><span>{payslip.month}/{payslip.year}</span></div>
              <div className="payslip-row"><span>Basic Salary</span><span>₹{parseFloat(payslip.base_salary || payslip.salary || 0).toFixed(2)}</span></div>
              <div className="payslip-row"><span>Bonus</span><span>₹{parseFloat(payslip.bonus || 0).toFixed(2)}</span></div>
              <div className="payslip-row"><span>Deductions</span><span style={{ color: '#ef4444' }}>- ₹{parseFloat(payslip.deductions || 0).toFixed(2)}</span></div>
              <div className="payslip-row net"><span>Net Pay</span><span>₹{parseFloat(payslip.net_salary || payslip.net_pay || 0).toFixed(2)}</span></div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Payroll History</h3></div>
        <form onSubmit={handleView} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input className="form-input" value={viewId} onChange={e => setViewId(e.target.value)} placeholder="Employee ID" style={{ flex: 1 }} />
          <button className="btn btn-primary" disabled={loading}>Fetch Payroll</button>
        </form>
        {payroll.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Payroll ID</th><th>Month</th><th>Year</th><th>Salary</th><th>Bonus</th><th>Net</th><th>Status</th></tr></thead>
              <tbody>
                {payroll.map((p, i) => (
                  <tr key={i}>
                    <td>{p.payroll_id?.toString() || p.id?.toString()}</td>
                    <td>{p.month}</td>
                    <td>{p.year}</td>
                    <td>₹{parseFloat(p.base_salary || p.salary || 0).toFixed(2)}</td>
                    <td>₹{parseFloat(p.bonus || 0).toFixed(2)}</td>
                    <td className="fw-600">₹{parseFloat(p.net_salary || p.net_pay || 0).toFixed(2)}</td>
                    <td><span className={`badge ${p.status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>{p.status || 'generated'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main HRPanel ─────────────────────────────────────────────────────────────
export default function HRPanel() {
  const [activeTab, setActiveTab] = useState(0);

  const renderTab = () => {
    switch (activeTab) {
      case 0: return <EmployeesTab />;
      case 1: return <DepartmentsTab />;
      case 2: return <AttendanceTab />;
      case 3: return <LeaveTab />;
      case 4: return <PayrollTab />;
      default: return null;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>HR Management</h2>
        <p className="text-muted text-sm">Manage employees, attendance, leave, and payroll.</p>
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
