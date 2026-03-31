import React, { useState, useEffect } from 'react';

const Admin = () => {
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs');
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1>Admin Control Center</h1>
        <button className="btn-primary" onClick={fetchLogs}>Reload Audit Logs</button>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>System Audit Logs</h2>
        
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Timestamp</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Action</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="3" style={{ padding: '1rem' }}>No system events recorded.</td></tr>
            ) : (
              logs.map((log, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>{log.action}</td>
                  <td style={{ padding: '1rem' }}>{log.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;
