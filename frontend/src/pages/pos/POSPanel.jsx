import { useState, useEffect } from 'react';
import {
  createSale, getSale, cancelSale, createPayment, createRefund,
  createCustomer, getCustomer, updateCustomer,
  getCustomerHistory, submitFeedback, getCustomerSummary,
  getDailyRevenue, getPaymentBreakdown, getTopProducts
} from '../../api/pos.api';
import { useAuth } from '../../context/AuthContext';
import { confirmCriticalAction } from '../../lib/confirm';

const TABS = ['New Sale', 'Sales History', 'Customers', 'Refunds', 'Analytics'];

function Alert({ type, msg, onClose }) {
  if (!msg) return null;
  return (
    <div className={`alert alert-${type}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>✕</button>
    </div>
  );
}

// ─── New Sale Tab ─────────────────────────────────────────────────────────────
function NewSaleTab() {
  const { user } = useAuth();
  const [productId, setProductId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [branchId, setBranchId] = useState('1');
  const [cart, setCart] = useState([]);
  const [payMethod, setPayMethod] = useState('cash');
  const [payAmount, setPayAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const TAX_RATE = 0.18;

  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = subtotal * TAX_RATE;
  const netTotal = subtotal + tax;

  const addToCart = () => {
    if (!productId || !batchId || !quantity || !unitPrice) {
      setMsg({ type: 'error', text: 'Fill all product fields before adding.' });
      return;
    }
    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);
    if (qty <= 0 || price <= 0) {
      setMsg({ type: 'error', text: 'Quantity and unit price must be positive.' });
      return;
    }
    setCart(prev => [...prev, {
      product_id: productId,
      batch_id: batchId,
      quantity: qty,
      unit_price: price,
      lineTotal: qty * price,
    }]);
    setProductId(''); setBatchId(''); setQuantity(''); setUnitPrice('');
    setMsg({ type: '', text: '' });
  };

  const removeFromCart = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      setMsg({ type: 'error', text: 'Cart is empty.' });
      return;
    }
    const payAmt = parseFloat(payAmount);
    if (Math.abs(payAmt - netTotal) > 0.01) {
      setMsg({ type: 'error', text: `Payment amount (${payAmt.toFixed(2)}) must equal net total (${netTotal.toFixed(2)}).` });
      return;
    }
    if (!confirmCriticalAction(`Complete this sale for net total ₹${netTotal.toFixed(2)} using ${payMethod.toUpperCase()}?`)) return;
    setLoading(true);
    try {
      const salePayload = {
        cashier_id: user?.user_id,
        branch_id: branchId,
        items: cart.map(item => ({
          product_id: item.product_id,
          batch_id: item.batch_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };
      const saleRes = await createSale(salePayload);
      const saleData = saleRes.data;
      const saleId = saleData.sale_id?.toString() || saleData.id?.toString();

      await createPayment({ sale_id: saleId, method: payMethod, amount: payAmt });

      setMsg({ type: 'success', text: `Sale #${saleId} completed! Payment of ₹${payAmt.toFixed(2)} recorded.` });
      setCart([]);
      setPayAmount('');
      setBranchId('1');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to process sale.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Add Product to Cart</h3></div>
          <div className="form-group">
            <label className="form-label">Branch ID</label>
            <input className="form-input" value={branchId} onChange={e => setBranchId(e.target.value)} placeholder="Branch ID" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Product ID</label>
              <input className="form-input" value={productId} onChange={e => setProductId(e.target.value)} placeholder="Product ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Batch ID</label>
              <input className="form-input" value={batchId} onChange={e => setBatchId(e.target.value)} placeholder="Batch ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input className="form-input" type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Qty" />
            </div>
            <div className="form-group">
              <label className="form-label">Unit Price (₹)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <button className="btn btn-primary" onClick={addToCart}>+ Add to Cart</button>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Cart Summary</h3></div>
          {cart.length === 0 ? (
            <div className="pos-cart-empty">Cart is empty. Add products to start a sale.</div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th><th>Batch</th><th>Qty</th><th>Price</th><th>Total</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, i) => (
                      <tr key={i}>
                        <td>{item.product_id}</td>
                        <td>{item.batch_id}</td>
                        <td>{item.quantity}</td>
                        <td>₹{item.unit_price.toFixed(2)}</td>
                        <td>₹{item.lineTotal.toFixed(2)}</td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => removeFromCart(i)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="total-section">
                <div className="total-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div className="total-row"><span>Tax (18%)</span><span>₹{tax.toFixed(2)}</span></div>
                <div className="total-row final"><span>Net Total</span><span>₹{netTotal.toFixed(2)}</span></div>
              </div>
              <hr className="section-divider" />
              <form onSubmit={handleSubmit}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount Paid (₹)</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      placeholder={netTotal.toFixed(2)}
                    />
                  </div>
                </div>
                <button className="btn btn-success" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Processing...' : 'Complete Sale'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sales History Tab ────────────────────────────────────────────────────────
function SalesHistoryTab() {
  const [saleId, setSaleId] = useState('');
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleFetch = async (e) => {
    e.preventDefault();
    if (!saleId) return;
    setLoading(true);
    setSale(null);
    try {
      const res = await getSale(saleId);
      setSale(res.data);
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Sale not found.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!sale) return;
    const id = sale.sale_id?.toString() || sale.id?.toString();
    if (!confirmCriticalAction(`Cancel completed sale #${id}?`)) return;
    setLoading(true);
    try {
      await cancelSale(id);
      setSale(prev => ({ ...prev, status: 'cancelled' }));
      setMsg({ type: 'success', text: `Sale #${id} cancelled.` });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to cancel sale.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="card">
        <div className="card-header"><h3 className="card-title">Lookup Sale</h3></div>
        <form onSubmit={handleFetch} style={{ display: 'flex', gap: '12px' }}>
          <input className="form-input" value={saleId} onChange={e => setSaleId(e.target.value)} placeholder="Sale ID" style={{ flex: 1 }} />
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Loading...' : 'Fetch Sale'}</button>
        </form>
      </div>

      {sale && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sale #{sale.sale_id?.toString() || sale.id?.toString()}</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`badge ${sale.status === 'completed' ? 'badge-green' : sale.status === 'cancelled' ? 'badge-red' : 'badge-yellow'}`}>
                {sale.status}
              </span>
              {sale.status === 'completed' && (
                <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={loading}>
                  Cancel Sale
                </button>
              )}
            </div>
          </div>
          <div className="grid-2">
            <div>
              <div className="stat-row"><span className="text-muted">Cashier ID</span><span>{sale.cashier_id?.toString()}</span></div>
              <div className="stat-row"><span className="text-muted">Branch ID</span><span>{sale.branch_id?.toString()}</span></div>
              <div className="stat-row"><span className="text-muted">Date</span><span>{sale.created_at || '—'}</span></div>
              <div className="stat-row"><span className="text-muted">Net Total</span><span style={{ fontWeight: 700 }}>₹{parseFloat(sale.net_total || 0).toFixed(2)}</span></div>
            </div>
          </div>
          {sale.items && sale.items.length > 0 && (
            <div className="mt-3">
              <h4 className="fw-600 mb-2">Items</h4>
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Product ID</th><th>Batch ID</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                  <tbody>
                    {sale.items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.product_id?.toString()}</td>
                        <td>{item.batch_id?.toString()}</td>
                        <td>{item.quantity}</td>
                        <td>₹{parseFloat(item.unit_price || 0).toFixed(2)}</td>
                        <td>₹{parseFloat(item.total_price || item.unit_price * item.quantity || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Customers Tab ────────────────────────────────────────────────────────────
function CustomersTab() {
  const [form, setFormField] = useState({ name: '', phone: '', email: '' });
  const [searchId, setSearchId] = useState('');
  const [customer, setCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [feedback, setFeedback] = useState({ rating: '5', comments: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      setMsg({ type: 'error', text: 'Name and phone are required.' });
      return;
    }
    setLoading(true);
    try {
      const payload = { name: form.name, phone: form.phone };
      if (form.email) payload.email = form.email;
      const res = await createCustomer(payload);
      setMsg({ type: 'success', text: `Customer "${form.name}" created. ID: ${res.data.customer_id?.toString() || res.data.id?.toString()}` });
      setFormField({ name: '', phone: '', email: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to create customer.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId) return;
    setLoading(true);
    setCustomer(null); setHistory([]); setSummary(null);
    try {
      const [custRes, histRes, sumRes] = await Promise.allSettled([
        getCustomer(searchId),
        getCustomerHistory(searchId),
        getCustomerSummary(searchId),
      ]);
      if (custRes.status === 'fulfilled') setCustomer(custRes.value.data);
      else setMsg({ type: 'error', text: 'Customer not found.' });
      if (histRes.status === 'fulfilled') setHistory(histRes.value.data || []);
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
    } catch {
      setMsg({ type: 'error', text: 'Failed to fetch customer.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    if (!customer) return;
    const custId = customer.customer_id?.toString() || customer.id?.toString();
    setLoading(true);
    try {
      await submitFeedback({ customer_id: custId, rating: parseInt(feedback.rating), comments: feedback.comments });
      setMsg({ type: 'success', text: 'Feedback submitted.' });
      setFeedback({ rating: '5', comments: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to submit feedback.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Create Customer</h3></div>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" value={form.name} onChange={e => setFormField(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input className="form-input" value={form.phone} onChange={e => setFormField(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setFormField(f => ({ ...f, email: e.target.value }))} placeholder="Optional" />
            </div>
            <button className="btn btn-primary" disabled={loading}>Create Customer</button>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Search Customer</h3></div>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input className="form-input" value={searchId} onChange={e => setSearchId(e.target.value)} placeholder="Customer ID" style={{ flex: 1 }} />
            <button className="btn btn-primary" disabled={loading}>Search</button>
          </form>
          {customer && (
            <div>
              <div className="stat-row"><span className="text-muted">Name</span><span className="fw-600">{customer.name}</span></div>
              <div className="stat-row"><span className="text-muted">Phone</span><span>{customer.phone}</span></div>
              <div className="stat-row"><span className="text-muted">Email</span><span>{customer.email || '—'}</span></div>
              {summary && (
                <>
                  <div className="stat-row"><span className="text-muted">Total Purchases</span><span>₹{parseFloat(summary.total_spent || 0).toFixed(2)}</span></div>
                  <div className="stat-row"><span className="text-muted">Visit Count</span><span>{summary.visit_count || '—'}</span></div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {customer && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><h3 className="card-title">Purchase History</h3></div>
            {history.length === 0 ? (
              <p className="text-muted">No history found.</p>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Sale ID</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i}>
                        <td>{h.sale_id?.toString() || h.id?.toString()}</td>
                        <td>{h.created_at || '—'}</td>
                        <td>₹{parseFloat(h.net_total || 0).toFixed(2)}</td>
                        <td><span className={`badge ${h.status === 'completed' ? 'badge-green' : 'badge-yellow'}`}>{h.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Submit Feedback</h3></div>
            <form onSubmit={handleFeedback}>
              <div className="form-group">
                <label className="form-label">Rating (1–5)</label>
                <select className="form-select" value={feedback.rating} onChange={e => setFeedback(f => ({ ...f, rating: e.target.value }))}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Comments</label>
                <textarea className="form-textarea" value={feedback.comments} onChange={e => setFeedback(f => ({ ...f, comments: e.target.value }))} placeholder="Customer feedback..." />
              </div>
              <button className="btn btn-primary" disabled={loading}>Submit Feedback</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Refunds Tab ──────────────────────────────────────────────────────────────
function RefundsTab() {
  const [saleId, setSaleId] = useState('');
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleRefund = async (e) => {
    e.preventDefault();
    if (!saleId || !itemId || !qty || !reason) {
      setMsg({ type: 'error', text: 'All fields required.' });
      return;
    }
    if (!confirmCriticalAction(`Process refund for sale ${saleId}, item ${itemId}, quantity ${qty}?`)) return;
    setLoading(true);
    try {
      const res = await createRefund({
        sale_id: saleId,
        items: [{ sale_item_id: itemId, quantity: parseFloat(qty), reason }],
      });
      setMsg({ type: 'success', text: `Refund processed. ID: ${res.data.refund_id?.toString() || 'Done'}` });
      setSaleId(''); setItemId(''); setQty(''); setReason('');
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Refund failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="card" style={{ maxWidth: '520px' }}>
        <div className="card-header"><h3 className="card-title">Process Refund</h3></div>
        <form onSubmit={handleRefund}>
          <div className="form-group">
            <label className="form-label">Sale ID *</label>
            <input className="form-input" value={saleId} onChange={e => setSaleId(e.target.value)} placeholder="Original Sale ID" />
          </div>
          <div className="form-group">
            <label className="form-label">Sale Item ID *</label>
            <input className="form-input" value={itemId} onChange={e => setItemId(e.target.value)} placeholder="Sale Item ID" />
          </div>
          <div className="form-group">
            <label className="form-label">Quantity to Refund *</label>
            <input className="form-input" type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} placeholder="Qty" />
          </div>
          <div className="form-group">
            <label className="form-label">Reason *</label>
            <textarea className="form-textarea" value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for refund..." />
          </div>
          <button className="btn btn-warning" disabled={loading}>{loading ? 'Processing...' : 'Process Refund'}</button>
        </form>
      </div>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function POSAnalyticsTab() {
  const [revenue, setRevenue] = useState(null);
  const [payments, setPayments] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [r, p, t] = await Promise.allSettled([getDailyRevenue(), getPaymentBreakdown(), getTopProducts()]);
      if (r.status === 'fulfilled') setRevenue(r.value.data);
      if (p.status === 'fulfilled') setPayments(p.value.data);
      if (t.status === 'fulfilled') setTopProducts(t.value.data);
    } catch {
      setError('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const renderTable = (data, title) => {
    if (!data) return null;
    const rows = Array.isArray(data) ? data : (data.data || []);
    if (rows.length === 0) return <p className="text-muted">No data available.</p>;
    const keys = Object.keys(rows[0]);
    return (
      <div className="card">
        <div className="card-header"><h3 className="card-title">{title}</h3></div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr>{keys.map(k => <th key={k}>{k}</th>)}</tr></thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {keys.map(k => <td key={k}>{row[k]?.toString() || '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">POS Analytics</h3>
          <button className="btn btn-secondary btn-sm" onClick={fetchAll} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        {loading && <p className="text-muted">Loading analytics...</p>}
      </div>
      {revenue && renderTable(revenue, 'Daily Revenue')}
      {payments && renderTable(payments, 'Payment Breakdown')}
      {topProducts && renderTable(topProducts, 'Top Products')}
    </div>
  );
}

// ─── Main POSPanel ────────────────────────────────────────────────────────────
export default function POSPanel() {
  const [activeTab, setActiveTab] = useState(0);

  const renderTab = () => {
    switch (activeTab) {
      case 0: return <NewSaleTab />;
      case 1: return <SalesHistoryTab />;
      case 2: return <CustomersTab />;
      case 3: return <RefundsTab />;
      case 4: return <POSAnalyticsTab />;
      default: return null;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Point of Sale</h2>
        <p className="text-muted text-sm">Process sales, manage customers, and view analytics.</p>
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
