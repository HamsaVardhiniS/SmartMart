import { useState, useEffect } from 'react';
import {
  getOrders, createOrder, addOrderItems, receiveItem, cancelOrder, recordPayment,
  getSuppliers, createSupplier, getSupplier, updateSupplier, deactivateSupplier
} from '../../api/procurement.api';
import { confirmCriticalAction } from '../../lib/confirm';

const TABS = ['Suppliers', 'Purchase Orders', 'Payments'];

function Alert({ type, msg, onClose }) {
  if (!msg) return null;
  return (
    <div className={`alert alert-${type}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>✕</button>
    </div>
  );
}

// ─── Suppliers Tab ────────────────────────────────────────────────────────────
function SuppliersTab() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ supplier_name: '', phone: '', email: '', gst_number: '', address: '' });
  const [viewId, setViewId] = useState('');
  const [viewedSupplier, setViewedSupplier] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchSuppliers = async () => {
    try {
      const res = await getSuppliers();
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch { setSuppliers([]); }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const { supplier_name, phone, email, gst_number } = form;
    if (!supplier_name || !phone || !email || !gst_number) {
      setMsg({ type: 'error', text: 'supplier_name, phone, email, gst_number required.' });
      return;
    }
    setLoading(true);
    try {
      await createSupplier(form);
      setMsg({ type: 'success', text: `Supplier "${supplier_name}" created.` });
      setForm({ supplier_name: '', phone: '', email: '', gst_number: '', address: '' });
      fetchSuppliers();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (e) => {
    e.preventDefault();
    if (!viewId) return;
    setLoading(true);
    setViewedSupplier(null);
    setEditForm(null);
    try {
      const res = await getSupplier(viewId);
      setViewedSupplier(res.data);
      setEditForm({ ...res.data });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Supplier not found.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!viewId || !editForm) return;
    setLoading(true);
    try {
      await updateSupplier(viewId, editForm);
      setMsg({ type: 'success', text: `Supplier ${viewId} updated.` });
      fetchSuppliers();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to update.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirmCriticalAction(`Deactivate supplier ${id}?`)) return;
    setLoading(true);
    try {
      await deactivateSupplier(id);
      setMsg({ type: 'success', text: `Supplier ${id} deactivated.` });
      fetchSuppliers();
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
          <div className="card-header"><h3 className="card-title">Create Supplier</h3></div>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Supplier Name *</label>
              <input className="form-input" value={form.supplier_name} onChange={e => setField('supplier_name', e.target.value)} placeholder="Supplier name" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input className="form-input" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="Phone" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="Email" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">GST Number *</label>
              <input className="form-input" value={form.gst_number} onChange={e => setField('gst_number', e.target.value)} placeholder="GST number" />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-textarea" value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Address (optional)" style={{ minHeight: '60px' }} />
            </div>
            <button className="btn btn-primary" disabled={loading}>Create Supplier</button>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">View / Update Supplier</h3></div>
          <form onSubmit={handleView} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input className="form-input" value={viewId} onChange={e => setViewId(e.target.value)} placeholder="Supplier ID" style={{ flex: 1 }} />
            <button className="btn btn-primary" disabled={loading}>Load</button>
          </form>
          {editForm && (
            <form onSubmit={handleUpdate}>
              {['supplier_name', 'phone', 'email', 'gst_number', 'address'].map(k => (
                <div className="form-group" key={k}>
                  <label className="form-label">{k.replace('_', ' ')}</label>
                  <input
                    className="form-input"
                    value={editForm[k] || ''}
                    onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" disabled={loading}>Save Changes</button>
                <button type="button" className="btn btn-danger" onClick={() => handleDeactivate(viewId)} disabled={loading}>Deactivate</button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Suppliers</h3>
          <button className="btn btn-secondary btn-sm" onClick={fetchSuppliers}>Refresh</button>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Email</th><th>GST</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {suppliers.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8' }}>No suppliers</td></tr>}
              {suppliers.map((s, i) => (
                <tr key={i}>
                  <td>{s.supplier_id?.toString() || s.id?.toString()}</td>
                  <td className="fw-600">{s.supplier_name || s.name}</td>
                  <td>{s.phone}</td>
                  <td>{s.email}</td>
                  <td>{s.gst_number}</td>
                  <td>
                    <span className={`badge ${s.is_active !== false ? 'badge-green' : 'badge-red'}`}>
                      {s.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {s.is_active !== false && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeactivate(s.supplier_id?.toString() || s.id?.toString())}
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Purchase Orders Tab ──────────────────────────────────────────────────────
function PurchaseOrdersTab() {
  const [orders, setOrders] = useState([]);
  const [createForm, setCreateForm] = useState({ supplier_id: '', branch_id: '', expected_delivery: '' });
  const [itemsForm, setItemsForm] = useState({ order_id: '', product_id: '', quantity: '', unit_cost: '' });
  const [receiveForm, setReceiveForm] = useState({ item_id: '', received_qty: '' });
  const [cancelId, setCancelId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchOrders = async () => {
    try {
      const res = await getOrders();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch { setOrders([]); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.supplier_id || !createForm.branch_id) {
      setMsg({ type: 'error', text: 'supplier_id and branch_id required.' });
      return;
    }
    setLoading(true);
    try {
      const payload = { supplier_id: createForm.supplier_id, branch_id: createForm.branch_id };
      if (createForm.expected_delivery) payload.expected_delivery = createForm.expected_delivery;
      const res = await createOrder(payload);
      setMsg({ type: 'success', text: `Order created. ID: ${res.data.order_id?.toString() || 'Done'}` });
      setCreateForm({ supplier_id: '', branch_id: '', expected_delivery: '' });
      fetchOrders();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItems = async (e) => {
    e.preventDefault();
    const { order_id, product_id, quantity, unit_cost } = itemsForm;
    if (!order_id || !product_id || !quantity || !unit_cost) {
      setMsg({ type: 'error', text: 'All item fields required.' });
      return;
    }
    setLoading(true);
    try {
      await addOrderItems(order_id, {
        items: [{ product_id, quantity: parseInt(quantity), unit_cost: parseFloat(unit_cost) }]
      });
      setMsg({ type: 'success', text: `Item added to order ${order_id}.` });
      setItemsForm({ order_id: '', product_id: '', quantity: '', unit_cost: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (e) => {
    e.preventDefault();
    if (!receiveForm.item_id || !receiveForm.received_qty) {
      setMsg({ type: 'error', text: 'item_id and received_qty required.' });
      return;
    }
    if (!confirmCriticalAction(`Receive ${receiveForm.received_qty} units for order item ${receiveForm.item_id}?`)) return;
    setLoading(true);
    try {
      await receiveItem(receiveForm.item_id, { received_qty: parseInt(receiveForm.received_qty) });
      setMsg({ type: 'success', text: `Received ${receiveForm.received_qty} units for item ${receiveForm.item_id}.` });
      setReceiveForm({ item_id: '', received_qty: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!cancelId) return;
    if (!confirmCriticalAction(`Cancel purchase order ${cancelId}?`)) return;
    setLoading(true);
    try {
      await cancelOrder(cancelId);
      setMsg({ type: 'success', text: `Order ${cancelId} cancelled.` });
      setCancelId('');
      fetchOrders();
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
          <div className="card-header"><h3 className="card-title">Create Purchase Order</h3></div>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Supplier ID *</label>
              <input className="form-input" value={createForm.supplier_id} onChange={e => setCreateForm(f => ({ ...f, supplier_id: e.target.value }))} placeholder="Supplier ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Branch ID *</label>
              <input className="form-input" value={createForm.branch_id} onChange={e => setCreateForm(f => ({ ...f, branch_id: e.target.value }))} placeholder="Branch ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Delivery</label>
              <input className="form-input" type="date" value={createForm.expected_delivery} onChange={e => setCreateForm(f => ({ ...f, expected_delivery: e.target.value }))} />
            </div>
            <button className="btn btn-primary" disabled={loading}>Create Order</button>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Add Items to Order</h3></div>
          <form onSubmit={handleAddItems}>
            <div className="form-group">
              <label className="form-label">Order ID *</label>
              <input className="form-input" value={itemsForm.order_id} onChange={e => setItemsForm(f => ({ ...f, order_id: e.target.value }))} placeholder="Order ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Product ID *</label>
              <input className="form-input" value={itemsForm.product_id} onChange={e => setItemsForm(f => ({ ...f, product_id: e.target.value }))} placeholder="Product ID" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input className="form-input" type="number" value={itemsForm.quantity} onChange={e => setItemsForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Qty" />
              </div>
              <div className="form-group">
                <label className="form-label">Unit Cost (₹) *</label>
                <input className="form-input" type="number" step="0.01" value={itemsForm.unit_cost} onChange={e => setItemsForm(f => ({ ...f, unit_cost: e.target.value }))} placeholder="0.00" />
              </div>
            </div>
            <button className="btn btn-primary" disabled={loading}>Add Items</button>
          </form>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Receive Goods</h3></div>
          <form onSubmit={handleReceive}>
            <div className="form-group">
              <label className="form-label">Order Item ID *</label>
              <input className="form-input" value={receiveForm.item_id} onChange={e => setReceiveForm(f => ({ ...f, item_id: e.target.value }))} placeholder="Item ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Received Quantity *</label>
              <input className="form-input" type="number" value={receiveForm.received_qty} onChange={e => setReceiveForm(f => ({ ...f, received_qty: e.target.value }))} placeholder="Qty" />
            </div>
            <button className="btn btn-success" disabled={loading}>Receive Goods</button>
          </form>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Cancel Order</h3></div>
          <form onSubmit={handleCancel}>
            <div className="form-group">
              <label className="form-label">Order ID *</label>
              <input className="form-input" value={cancelId} onChange={e => setCancelId(e.target.value)} placeholder="Order ID to cancel" />
            </div>
            <button className="btn btn-danger" disabled={loading}>Cancel Order</button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Purchase Orders</h3>
          <button className="btn btn-secondary btn-sm" onClick={fetchOrders}>Refresh</button>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Order ID</th><th>Supplier ID</th><th>Branch ID</th><th>Expected Delivery</th><th>Status</th></tr></thead>
            <tbody>
              {orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>No orders</td></tr>}
              {orders.map((o, i) => (
                <tr key={i}>
                  <td>{o.order_id?.toString() || o.id?.toString()}</td>
                  <td>{o.supplier_id?.toString()}</td>
                  <td>{o.branch_id?.toString()}</td>
                  <td>{o.expected_delivery || '—'}</td>
                  <td>
                    <span className={`badge ${
                      o.status === 'completed' ? 'badge-green' :
                      o.status === 'cancelled' ? 'badge-red' :
                      o.status === 'pending' ? 'badge-yellow' : 'badge-blue'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────
function PaymentsTab() {
  const [form, setForm] = useState({ supplier_id: '', amount: '', payment_method: 'bank_transfer', reference_no: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [history, setHistory] = useState([]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier_id || !form.amount || !form.payment_method) {
      setMsg({ type: 'error', text: 'supplier_id, amount, and payment_method required.' });
      return;
    }
    if (!confirmCriticalAction(`Record supplier payment of ₹${form.amount} for supplier ${form.supplier_id}?`)) return;
    setLoading(true);
    try {
      const payload = {
        supplier_id: form.supplier_id,
        amount: parseFloat(form.amount),
        payment_method: form.payment_method,
      };
      if (form.reference_no) payload.reference_no = form.reference_no;
      const res = await recordPayment(payload);
      const pid = res.data.payment_id?.toString() || res.data.id?.toString() || Date.now().toString();
      setHistory(prev => [...prev, { ...payload, payment_id: pid, created_at: new Date().toLocaleString() }]);
      setMsg({ type: 'success', text: `Payment of ₹${form.amount} recorded. ID: ${pid}` });
      setForm({ supplier_id: '', amount: '', payment_method: 'bank_transfer', reference_no: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to record payment.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Record Supplier Payment</h3></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Supplier ID *</label>
              <input className="form-input" value={form.supplier_id} onChange={e => setField('supplier_id', e.target.value)} placeholder="Supplier ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input className="form-input" type="number" step="0.01" value={form.amount} onChange={e => setField('amount', e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select className="form-select" value={form.payment_method} onChange={e => setField('payment_method', e.target.value)}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Reference No</label>
              <input className="form-input" value={form.reference_no} onChange={e => setField('reference_no', e.target.value)} placeholder="Optional reference number" />
            </div>
            <button className="btn btn-success" disabled={loading}>{loading ? 'Processing...' : 'Record Payment'}</button>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Payment History (This Session)</h3></div>
          {history.length === 0 ? (
            <p className="text-muted">No payments recorded this session.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>ID</th><th>Supplier</th><th>Amount</th><th>Method</th><th>Time</th></tr></thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td>{h.payment_id}</td>
                      <td>{h.supplier_id}</td>
                      <td>₹{parseFloat(h.amount).toFixed(2)}</td>
                      <td><span className="badge badge-blue">{h.payment_method}</span></td>
                      <td style={{ fontSize: '0.8rem' }}>{h.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ProcurementPanel ────────────────────────────────────────────────────
export default function ProcurementPanel() {
  const [activeTab, setActiveTab] = useState(0);

  const renderTab = () => {
    switch (activeTab) {
      case 0: return <SuppliersTab />;
      case 1: return <PurchaseOrdersTab />;
      case 2: return <PaymentsTab />;
      default: return null;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Procurement</h2>
        <p className="text-muted text-sm">Manage suppliers, purchase orders, and payments.</p>
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
