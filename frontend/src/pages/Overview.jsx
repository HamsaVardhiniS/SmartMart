import React, { useState, useEffect } from 'react';

const Overview = () => {
  const [stats, setStats] = useState({
    dailyRevenue: '...',
    topProducts: [],
    lowStock: []
  });

  useEffect(() => {
    // We will just mock fetching and try to fetch
    const fetchStats = async () => {
      try {
        const revRes = await fetch('/api/pos/analytics/daily-revenue');
        if (revRes.ok) {
          const revData = await revRes.json();
          setStats(s => ({ ...s, dailyRevenue: revData.data || 0 }));
        }
      } catch (e) { console.warn("Failed to fetch revenue", e); }
    };

    fetchStats();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1>SmartMart Overview</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome to the retail enterprise control center.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel hover-lift dashboard-card">
          <div className="card-title">Daily Revenue</div>
          <div className="card-value gradient-text">${stats.dailyRevenue}</div>
        </div>

        <div className="glass-panel hover-lift dashboard-card">
          <div className="card-title">Low Stock Alerts</div>
          <div className="card-value" style={{ color: 'var(--warning)' }}>0 Items</div>
        </div>

        <div className="glass-panel hover-lift dashboard-card">
          <div className="card-title">System Health</div>
          <div className="status-badge status-success" style={{ marginTop: '0.5rem' }}>All Services Operational</div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
