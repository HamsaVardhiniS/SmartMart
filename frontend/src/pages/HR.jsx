import React, { useState, useEffect } from 'react';

const HR = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/hr/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.data || []);
      } else {
        setError('Failed to fetch HR data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1>HR & Payroll Module</h1>
        <button className="btn-primary" onClick={fetchEmployees}>Refresh List</button>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Employee Directory</h2>
        
        {loading ? (
          <p>Loading records...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem', fontWeight: 500 }}>ID</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>First Name</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Last Name</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '1rem' }}>No employees found.</td></tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.employee_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem' }}>{emp.employee_id}</td>
                    <td style={{ padding: '1rem' }}>{emp.first_name}</td>
                    <td style={{ padding: '1rem' }}>{emp.last_name}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className="status-badge status-success">{emp.employment_status || 'Active'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HR;
