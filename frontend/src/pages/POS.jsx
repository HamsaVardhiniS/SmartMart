import React, { useState } from 'react';

const POS = () => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const handleSale = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    
    const payload = {
      branch_id: 1,
      customer_id: 1,
      processed_by: 1,
      other_discount: 0,
      items: [
        {
          product_id: 1,
          batch_id: 1,
          quantity: 2,
          price: 50.00,
          tax_percentage: 5,
          discount: 0
        }
      ],
      payments: [
        {
          method: "CASH",
          amount: 105
        }
      ]
    };

    try {
      const res = await fetch('/api/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok && data.sale) {
        setSuccessMsg(`Sale successful! Transaction ID: ${data.sale.transaction_id}`);
      } else {
        setSuccessMsg(`Error: Failed to complete sale`);
      }
    } catch (err) {
      setSuccessMsg(`Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="header">
        <h1>Point of Sale</h1>
      </div>
      
      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Create New Sale</h2>
        
        <form onSubmit={handleSale}>
          <div className="input-group">
            <label>Product ID</label>
            <input type="number" defaultValue="1" className="input-field" disabled />
          </div>
          
          <div className="input-group">
            <label>Quantity</label>
            <input type="number" defaultValue="2" className="input-field" disabled />
          </div>
          
          <div className="input-group">
            <label>Price</label>
            <input type="number" defaultValue="50" className="input-field" disabled />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', width: '100%' }}>
            {loading ? 'Processing...' : 'Complete Sale'}
          </button>
        </form>

        {successMsg && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '8px' }}>
            {successMsg}
            <div style={{ fontSize: '0.85rem', marginTop: '0.4rem', color: 'var(--text-secondary)' }}>
              (Check Inventory dashboard to verify stock was reduced via Redis Event)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;
