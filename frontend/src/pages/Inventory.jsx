import React, { useState, useEffect } from 'react';

const Inventory = () => {
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStock = async () => {
    setLoading(true);
    try {
      // Assuming product 1, branch 1 for our POS demo
      const res = await fetch('/api/inventory/products/1/stock?branchId=1');
      if (res.ok) {
        const data = await res.json();
        setStock(data.data || { total_stock: 0 });
      } else {
        setStock({ error: 'Failed to fetch' });
      }
    } catch (err) {
      setStock({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
    
    // Auto refresh every 5s to see Redis events take effect
    const interval = setInterval(fetchStock, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1>Inventory Dashboard</h1>
        <button className="btn-primary" onClick={fetchStock}>Refresh Now</button>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Live Stock Monitoring</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          This table automatically refreshes every 5 seconds to show real-time changes propagated from the POS system via Redis.
        </p>

        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Product ID</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Branch ID</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Current Stock Count</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover-lift" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'var(--bg-tertiary)' }}>
              <td style={{ padding: '1rem' }}>1</td>
              <td style={{ padding: '1rem' }}>1</td>
              <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                {loading && !stock ? 'Loading...' : stock?.error ? 'Error' : stock?.total_quantity}
              </td>
              <td style={{ padding: '1rem' }}>
                {stock?.total_quantity <= 10 ? (
                  <span className="status-badge status-warning">Low Stock</span>
                ) : (
                  <span className="status-badge status-success">Healthy</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
