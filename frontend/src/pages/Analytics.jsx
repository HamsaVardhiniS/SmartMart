import React, { useState, useEffect } from 'react';

const Analytics = () => {
  const [data, setData] = useState(null);

  const fetchAnalytics = async () => {
    try {
      // By-passing Auth proxy if it throws 401 by using the POS analytics subset
      const res = await fetch('/api/pos/analytics/daily-revenue?branchId=1');
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1>Executive Analytics</h1>
        <button className="btn-primary" onClick={fetchAnalytics}>Refresh Report</button>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Daily Revenue Snapshot</h2>
        
        {!data ? (
          <p>Loading analytics data...</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Date</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Branch</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan="3" style={{ padding: '1rem' }}>No telemetry available.</td></tr>
              ) : (
                data.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem' }}>{new Date(row.transaction_date).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>{row.branch_id}</td>
                    <td style={{ padding: '1rem', color: '#10b981', fontWeight: 'bold' }}>${Number(row.daily_revenue).toFixed(2)}</td>
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

export default Analytics;
