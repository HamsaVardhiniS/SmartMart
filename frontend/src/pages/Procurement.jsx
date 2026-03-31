import React, { useState, useEffect } from 'react';

const Procurement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/procurement/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1>Procurement Tracker</h1>
        <button className="btn-primary" onClick={fetchOrders}>Refresh Orders</button>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Purchase Orders</h2>
        
        {loading ? (
          <p>Loading purchase orders...</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem', fontWeight: 500 }}>PO Number</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Branch ID</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Total Amount</th>
                <th style={{ padding: '1rem', fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '1rem' }}>No orders found.</td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order.order_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem' }}>{order.po_number || order.order_id}</td>
                    <td style={{ padding: '1rem' }}>{order.branch_id}</td>
                    <td style={{ padding: '1rem' }}>${Number(order.total_amount).toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>{order.order_status}</td>
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

export default Procurement;
