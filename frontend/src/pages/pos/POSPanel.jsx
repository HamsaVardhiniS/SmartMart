import { useState, useEffect, useMemo } from 'react';
import {
  createSale, getSale, cancelSale,
  createPayment, createRefund,
  createCustomer, getCustomer, updateCustomer,
  getCustomerHistory, submitFeedback, getCustomerSummary,
} from '../../api/pos.api';
import { getProducts, getStock } from '../../api/inventory.api';
import { useAuth } from '../../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAYMENT_METHODS = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'WALLET', 'STORE_CREDIT', 'GIFT_CARD'];
const REFUND_STATUS   = ['PARTIAL', 'FULL'];
const TAX_RATE        = 0.18; // fallback 18%, overridden by product's tax_percentage
const DEFAULT_BRANCH  = 1;

// ─── Tiny shared UI ───────────────────────────────────────────────────────────
function Toast({ type, msg, onClose }) {
  if (!msg) return null;
  const s = {
    success: { bg: '#f0fdf4', border: '#16a34a', color: '#15803d' },
    error:   { bg: '#fef2f2', border: '#dc2626', color: '#b91c1c' },
    info:    { bg: '#eff6ff', border: '#2563eb', color: '#1d4ed8' },
  }[type] || {};
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
      background:s.bg, border:`1px solid ${s.border}`, borderRadius:10,
      padding:'11px 15px', marginBottom:12, color:s.color, fontSize:'0.85rem' }}>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer',
        color:s.color, fontWeight:700, fontSize:'1rem', paddingLeft:8 }}>×</button>
    </div>
  );
}

function Spinner({ size = 16 }) {
  return <span style={{ display:'inline-block', width:size, height:size, border:`2px solid rgba(37,99,235,0.25)`,
    borderTopColor:'#2563eb', borderRadius:'50%', animation:'pos-spin 0.65s linear infinite' }} />;
}

function PosBtn({ variant='primary', size='md', loading, disabled, children, ...rest }) {
  const base = { display:'inline-flex', alignItems:'center', gap:6, border:'none', borderRadius:9,
    cursor: disabled||loading ? 'not-allowed' : 'pointer', fontWeight:600, transition:'all 0.18s',
    opacity: disabled||loading ? 0.55 : 1, fontSize: size==='sm' ? '0.78rem' : '0.88rem',
    padding: size==='sm' ? '6px 12px' : '9px 18px', whiteSpace:'nowrap' };
  const themes = {
    primary: { background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', boxShadow:'0 2px 8px rgba(37,99,235,0.28)' },
    success: { background:'#16a34a', color:'#fff' },
    danger:  { background:'#dc2626', color:'#fff' },
    warning: { background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff' },
    ghost:   { background:'#f1f5f9', color:'#374151', border:'1px solid #e2e8f0' },
    outline: { background:'transparent', color:'#2563eb', border:'1.5px solid #2563eb' },
  };
  return (
    <button style={{ ...base, ...themes[variant] }} disabled={disabled||loading} {...rest}>
      {loading && <Spinner size={13} />}
      {children}
    </button>
  );
}

function Field({ label, required, hint, error, children }) {
  return (
    <div style={{ marginBottom:13 }}>
      <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'#374151', marginBottom:4 }}>
        {label}{required && <span style={{ color:'#ef4444', marginLeft:2 }}>*</span>}
      </label>
      {children}
      {hint  && <p style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:3 }}>{hint}</p>}
      {error && <p style={{ fontSize:'0.72rem', color:'#ef4444', marginTop:3 }}>{error}</p>}
    </div>
  );
}

const inp = { width:'100%', padding:'8px 11px', border:'1.5px solid #bfdbfe', borderRadius:8,
  fontSize:'0.87rem', outline:'none', background:'#f8faff', color:'#1e293b', boxSizing:'border-box' };
const sel = { ...inp, cursor:'pointer' };

// ─── POS TABS ─────────────────────────────────────────────────────────────────
const TABS = [
  { key:'billing',   icon:'🧾', label:'New Bill' },
  { key:'lookup',    icon:'🔍', label:'Lookup Sale' },
  { key:'refund',    icon:'↩️', label:'Refund' },
  { key:'customers', icon:'👥', label:'Customers' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// BILLING TAB
// ═══════════════════════════════════════════════════════════════════════════════
function BillingTab({ user }) {
  const [products,  setProducts]  = useState([]);
  const [search,    setSearch]    = useState('');
  const [cart,      setCart]      = useState([]);
  const [otherDisc, setOtherDisc] = useState(0);
  const [payments,  setPayments]  = useState([{ method:'CASH', amount:'', reference:'' }]);
  const [customerId,setCustomerId]= useState('');
  const [custLookup,setCustLookup]= useState('');
  const [custInfo,  setCustInfo]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [loadingProd, setLoadingProd] = useState(true);
  const [msg, setMsg] = useState({ type:'', text:'' });
  const [lastSale, setLastSale]   = useState(null);
  const [showNewCust, setShowNewCust] = useState(false);
  const [stockMap,  setStockMap]  = useState({});

  // Load all products on mount
  useEffect(() => {
    getProducts()
      .then(r => setProducts(Array.isArray(r.data) ? r.data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProd(false));
  }, []);

  // Filtered product list
  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return products.filter(p =>
      (p.product_name || p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      String(p.product_id || p.id || '').includes(q)
    ).slice(0, 12);
  }, [products, search]);

  // Fetch stock for a product+branch before adding to cart
  const fetchStock = async (productId) => {
    if (stockMap[productId] !== undefined) return stockMap[productId];
    try {
      const r = await getStock(productId, DEFAULT_BRANCH);
      const qty = r.data?.quantity_on_hand ?? r.data?.total_in_stock ?? null;
      setStockMap(m => ({ ...m, [productId]: qty }));
      return qty;
    } catch { return null; }
  };

  const addToCart = async (product) => {
    const pid = product.product_id || product.id;
    const stock = await fetchStock(pid);
    const price = parseFloat(product.selling_price || product.unit_price || 0);
    const tax   = parseFloat(product.tax_percentage || 0);

    const existing = cart.find(c => c.product_id === pid && !c.batch_id);
    if (existing) {
      const newQty = existing.quantity + 1;
      if (stock !== null && newQty > stock) {
        setMsg({ type:'error', text:`Only ${stock} units of "${product.product_name || product.name}" in stock.` });
        return;
      }
      setCart(prev => prev.map(c => c.product_id === pid && !c.batch_id ? { ...c, quantity: newQty } : c));
    } else {
      if (stock !== null && stock < 1) {
        setMsg({ type:'error', text:`"${product.product_name || product.name}" is out of stock.` });
        return;
      }
      setCart(prev => [...prev, {
        product_id:    pid,
        batch_id:      null,
        name:          product.product_name || product.name || `Product #${pid}`,
        price,
        tax_percentage: tax,
        quantity:      1,
        discount:      0,
        stock,
      }]);
    }
    setSearch('');
  };

  const updateCart = (idx, field, value) => {
    setCart(prev => {
      const next = [...prev];
      const item = { ...next[idx] };
      item[field] = field === 'quantity' || field === 'discount' ? parseFloat(value) || 0 : value;
      // Stock guard
      if (field === 'quantity' && item.stock !== null && item.quantity > item.stock) {
        setMsg({ type:'error', text:`Max stock: ${item.stock} units.` });
        item.quantity = item.stock;
      }
      next[idx] = item;
      return next;
    });
  };

  const removeFromCart = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));

  // Totals
  const { subtotal, taxTotal, netAmount } = useMemo(() => {
    let sub = 0, tax = 0;
    for (const item of cart) {
      const lineTotal = item.price * item.quantity - (item.discount || 0);
      sub += lineTotal;
      tax += (item.tax_percentage / 100) * item.price * item.quantity;
    }
    const net = Math.max(0, sub + tax - parseFloat(otherDisc || 0));
    return { subtotal: sub, taxTotal: tax, netAmount: net };
  }, [cart, otherDisc]);

  const paymentTotal = useMemo(() =>
    payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  , [payments]);

  const paymentValid = Math.abs(paymentTotal - netAmount) < 0.01;

  // Customer lookup by ID
  const lookupCustomer = async () => {
    if (!custLookup.trim()) return;
    try {
      const r = await getCustomer(parseInt(custLookup));
      setCustInfo(r.data);
      setCustomerId(String(r.data.customer_id));
      setMsg({ type:'success', text:`Customer: ${r.data.first_name} ${r.data.last_name}` });
    } catch {
      setMsg({ type:'error', text:'Customer not found.' });
    }
  };

  // Place sale
  const handleCheckout = async () => {
    if (cart.length === 0) { setMsg({ type:'error', text:'Cart is empty.' }); return; }
    if (!paymentValid) { setMsg({ type:'error', text:`Payment total (₹${paymentTotal.toFixed(2)}) must exactly match net amount (₹${netAmount.toFixed(2)}).` }); return; }
    setLoading(true);
    try {
      const payload = {
        branch_id:      DEFAULT_BRANCH,
        processed_by:   user?.user_id || user?.id || 1,
        customer_id:    customerId ? parseInt(customerId) : undefined,
        other_discount: parseFloat(otherDisc || 0),
        items: cart.map(c => ({
          product_id:     c.product_id,
          batch_id:       c.batch_id || undefined,
          quantity:       c.quantity,
          price:          c.price,
          tax_percentage: c.tax_percentage || 0,
          discount:       c.discount || 0,
        })),
        payments: payments.map(p => ({
          method:    p.method,
          amount:    parseFloat(p.amount),
          reference: p.reference || undefined,
        })),
      };
      const res = await createSale(payload);
      setLastSale(res.data?.sale || res.data);
      setCart([]); setPayments([{ method:'CASH', amount:'', reference:'' }]);
      setOtherDisc(0); setCustomerId(''); setCustInfo(null);
      setMsg({ type:'success', text:`Sale completed! Invoice: ${res.data?.sale?.invoice_number || res.data?.invoice_number || '—'}` });
    } catch (err) {
      setMsg({ type:'error', text: err?.response?.data?.message || err?.message || 'Failed to create sale.' });
    } finally { setLoading(false); }
  };

  return (
    <div className="pos-layout">
      {/* ── Left: Product Search + Cart ── */}
      <div className="pos-left">
        <Toast type={msg.type} msg={msg.text} onClose={() => setMsg({ type:'', text:'' })} />

        {/* Customer Bar */}
        <div className="pos-section">
          <div className="pos-section-title">👤 Customer (Optional)</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <input style={{ ...inp, flex:1, minWidth:100 }} placeholder="Customer ID" type="number"
              value={custLookup} onChange={e => setCustLookup(e.target.value)}
              onKeyDown={e => e.key==='Enter' && lookupCustomer()} />
            <PosBtn size="sm" variant="outline" onClick={lookupCustomer}>Lookup</PosBtn>
            <PosBtn size="sm" variant="ghost" onClick={() => setShowNewCust(true)}>+ New</PosBtn>
          </div>
          {custInfo && (
            <div className="pos-cust-pill">
              <span>✓ {custInfo.first_name} {custInfo.last_name}</span>
              {custInfo.phone && <span>📱 {custInfo.phone}</span>}
              <button onClick={() => { setCustInfo(null); setCustomerId(''); setCustLookup(''); }}
                style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontWeight:700 }}>✕</button>
            </div>
          )}
          {showNewCust && (
            <QuickCreateCustomer
              onCreated={(c) => { setCustInfo(c); setCustomerId(String(c.customer_id)); setShowNewCust(false); }}
              onClose={() => setShowNewCust(false)}
            />
          )}
        </div>

        {/* Product Search */}
        <div className="pos-section">
          <div className="pos-section-title">🔍 Search Products</div>
          <input style={inp} placeholder="Type product name or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
          {loadingProd && <p style={{ color:'#94a3b8', fontSize:'0.8rem', marginTop:6 }}>Loading products…</p>}
          {filtered.length > 0 && (
            <div className="pos-product-list">
              {filtered.map(p => {
                const pid = p.product_id || p.id;
                const stock = stockMap[pid];
                return (
                  <button key={pid} className="pos-product-item" onClick={() => addToCart(p)}>
                    <div>
                      <p className="pos-product-name">{p.product_name || p.name || `#${pid}`}</p>
                      <p className="pos-product-meta">
                        SKU: {p.sku || '—'} · ₹{parseFloat(p.selling_price || p.unit_price || 0).toFixed(2)}
                        {stock !== undefined && stock !== null && (
                          <span style={{ color: stock < 5 ? '#ef4444' : '#16a34a', marginLeft:6 }}>· Stock: {stock}</span>
                        )}
                      </p>
                    </div>
                    <span className="pos-add-btn">＋</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="pos-section pos-cart-section">
          <div className="pos-section-title">🛒 Cart {cart.length > 0 && `(${cart.length} item${cart.length>1?'s':''})`}</div>
          {cart.length === 0 ? (
            <p className="pos-empty">No items added. Search and add products above.</p>
          ) : (
            <div className="pos-cart-table-wrap">
              <table className="pos-cart-table">
                <thead>
                  <tr>
                    <th>Product</th><th>Price</th><th>Qty</th><th>Disc (₹)</th><th>Tax%</th><th>Line Total</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => {
                    const line = item.price * item.quantity - (item.discount || 0);
                    const tax  = (item.tax_percentage / 100) * item.price * item.quantity;
                    return (
                      <tr key={idx}>
                        <td>
                          <p style={{ fontWeight:600, fontSize:'0.85rem' }}>{item.name}</p>
                          {item.batch_id && <p style={{ fontSize:'0.72rem', color:'#64748b' }}>Batch #{item.batch_id}</p>}
                        </td>
                        <td>₹{item.price.toFixed(2)}</td>
                        <td>
                          <input type="number" min={1} max={item.stock ?? 9999}
                            value={item.quantity}
                            onChange={e => updateCart(idx, 'quantity', e.target.value)}
                            className="pos-qty-input" />
                        </td>
                        <td>
                          <input type="number" min={0}
                            value={item.discount}
                            onChange={e => updateCart(idx, 'discount', e.target.value)}
                            className="pos-qty-input" />
                        </td>
                        <td>{item.tax_percentage}%</td>
                        <td style={{ fontWeight:600 }}>₹{(line + tax).toFixed(2)}</td>
                        <td>
                          <button onClick={() => removeFromCart(idx)} className="pos-remove-btn">✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Summary + Payment ── */}
      <div className="pos-right">
        {/* Order Summary */}
        <div className="pos-summary-card">
          <div className="pos-summary-title">Order Summary</div>
          <div className="pos-summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="pos-summary-row"><span>Tax</span><span>₹{taxTotal.toFixed(2)}</span></div>
          <div className="pos-summary-row">
            <span>Discount (₹)</span>
            <input type="number" min={0} value={otherDisc}
              onChange={e => setOtherDisc(e.target.value)}
              style={{ width:70, ...inp, padding:'4px 8px', textAlign:'right' }} />
          </div>
          <div className="pos-summary-divider" />
          <div className="pos-summary-row pos-net-row">
            <span>Net Amount</span>
            <span>₹{netAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payments */}
        <div className="pos-payments-card">
          <div className="pos-summary-title">💳 Payments</div>
          {payments.map((p, pi) => (
            <div key={pi} className="pos-payment-row">
              <select style={{ ...sel, flex:1 }} value={p.method}
                onChange={e => setPayments(prev => prev.map((x,i) => i===pi ? {...x, method:e.target.value} : x))}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
              </select>
              <input type="number" min={0} placeholder="₹ Amount" style={{ ...inp, width:90 }}
                value={p.amount}
                onChange={e => setPayments(prev => prev.map((x,i) => i===pi ? {...x, amount:e.target.value} : x))} />
              <input placeholder="Ref (optional)" style={{ ...inp, flex:1 }}
                value={p.reference}
                onChange={e => setPayments(prev => prev.map((x,i) => i===pi ? {...x, reference:e.target.value} : x))} />
              {payments.length > 1 && (
                <button onClick={() => setPayments(prev => prev.filter((_,i) => i!==pi))}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontWeight:700 }}>✕</button>
              )}
            </div>
          ))}
          <PosBtn size="sm" variant="ghost" onClick={() => setPayments(prev => [...prev, { method:'CASH', amount:'', reference:'' }])}>
            + Add Payment Method
          </PosBtn>

          <div className="pos-payment-match" style={{ color: paymentValid ? '#16a34a' : '#dc2626' }}>
            Paid: ₹{paymentTotal.toFixed(2)} / Net: ₹{netAmount.toFixed(2)}
            {cart.length > 0 && !paymentValid && <span className="pos-mismatch-tag">⚠ Mismatch</span>}
          </div>
        </div>

        {/* Place Order */}
        <PosBtn
          variant="primary"
          loading={loading}
          disabled={cart.length === 0 || !paymentValid}
          onClick={handleCheckout}
          style={{ width:'100%', padding:'13px', justifyContent:'center', fontSize:'0.95rem', marginTop:4 }}
        >
          ✓ Complete Sale
        </PosBtn>

        {/* Last sale summary */}
        {lastSale && (
          <div className="pos-receipt">
            <div className="pos-receipt-title">✅ Sale Completed</div>
            <p><b>Invoice:</b> {lastSale.invoice_number || '—'}</p>
            <p><b>Transaction ID:</b> #{String(lastSale.transaction_id || lastSale.id || '—')}</p>
            <p><b>Net Amount:</b> ₹{parseFloat(lastSale.net_amount || 0).toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Quick Create Customer (inline) ───────────────────────────────────────────
function QuickCreateCustomer({ onCreated, onClose }) {
  const [f, setF] = useState({ first_name:'', last_name:'', phone:'', email:'' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!f.first_name.trim()) { setErr('First name is required.'); return; }
    setLoading(true);
    try {
      const res = await createCustomer(f);
      onCreated(res.data);
    } catch (err) {
      setErr(err?.response?.data?.message || 'Failed to create customer.');
    } finally { setLoading(false); }
  };

  return (
    <div className="pos-inline-form">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <span style={{ fontWeight:700, color:'#1e3a8a', fontSize:'0.9rem' }}>New Customer</span>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:'1.1rem' }}>✕</button>
      </div>
      {err && <Toast type="error" msg={err} onClose={() => setErr('')} />}
      <form onSubmit={submit}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <input style={inp} placeholder="First Name *" value={f.first_name} onChange={e => setF(p => ({...p, first_name:e.target.value}))} />
          <input style={inp} placeholder="Last Name"   value={f.last_name}  onChange={e => setF(p => ({...p, last_name:e.target.value}))} />
          <input style={inp} placeholder="Phone"       value={f.phone}      onChange={e => setF(p => ({...p, phone:e.target.value}))} />
          <input style={inp} placeholder="Email"       value={f.email}      onChange={e => setF(p => ({...p, email:e.target.value}))} type="email" />
        </div>
        <PosBtn type="submit" loading={loading} style={{ marginTop:10, width:'100%', justifyContent:'center' }}>Create Customer</PosBtn>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SALE LOOKUP TAB
// ═══════════════════════════════════════════════════════════════════════════════
function LookupTab() {
  const [saleId, setSaleId] = useState('');
  const [sale, setSale]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState({ type:'', text:'' });
  const [cancelling, setCancelling] = useState(false);

  const lookup = async () => {
    if (!saleId.trim()) return;
    setLoading(true); setSale(null);
    try {
      const r = await getSale(parseInt(saleId));
      setSale(r.data);
    } catch (err) {
      setMsg({ type:'error', text: err?.response?.data?.message || 'Sale not found.' });
    } finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (!window.confirm(`Cancel sale #${sale.transaction_id}? This only works for COMPLETED sales.`)) return;
    setCancelling(true);
    try {
      const r = await cancelSale(parseInt(String(sale.transaction_id)));
      setSale(r.data);
      setMsg({ type:'success', text:`Sale #${sale.transaction_id} cancelled.` });
    } catch (err) {
      setMsg({ type:'error', text: err?.response?.data?.message || 'Cancel failed.' });
    } finally { setCancelling(false); }
  };

  return (
    <div className="pos-tab-content">
      <Toast type={msg.type} msg={msg.text} onClose={() => setMsg({ type:'', text:'' })} />
      <div className="pos-section" style={{ maxWidth:480 }}>
        <div className="pos-section-title">🔍 Look Up Sale by Transaction ID</div>
        <div style={{ display:'flex', gap:8 }}>
          <input style={{ ...inp, flex:1 }} type="number" placeholder="Transaction ID"
            value={saleId} onChange={e => setSaleId(e.target.value)}
            onKeyDown={e => e.key==='Enter' && lookup()} />
          <PosBtn loading={loading} onClick={lookup}>Look Up</PosBtn>
        </div>
      </div>

      {sale && (
        <div className="pos-section">
          <div className="pos-detail-header">
            <div>
              <p className="pos-section-title">Sale #{String(sale.transaction_id)}</p>
              <p style={{ fontSize:'0.8rem', color:'#64748b' }}>Invoice: {sale.invoice_number} · {new Date(sale.transaction_date).toLocaleString()}</p>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span className={`pos-status-badge ${sale.transaction_status}`}>{sale.transaction_status}</span>
              {String(sale.transaction_status) === 'COMPLETED' && (
                <PosBtn size="sm" variant="danger" loading={cancelling} onClick={handleCancel}>Cancel Sale</PosBtn>
              )}
            </div>
          </div>

          <div className="pos-detail-grid">
            <div>
              <p className="pos-kv"><b>Total Amount:</b> ₹{parseFloat(sale.total_amount||0).toFixed(2)}</p>
              <p className="pos-kv"><b>Tax:</b> ₹{parseFloat(sale.tax_amount||0).toFixed(2)}</p>
              <p className="pos-kv"><b>Discount:</b> ₹{parseFloat(sale.other_discount||0).toFixed(2)}</p>
              <p className="pos-kv"><b>Net Amount:</b> ₹{parseFloat(sale.net_amount||0).toFixed(2)}</p>
              <p className="pos-kv"><b>Payment Verified:</b> {sale.payment_verified ? '✅ Yes' : '❌ No'}</p>
            </div>
            <div>
              <p className="pos-kv"><b>Customer ID:</b> {sale.customer_id || '—'}</p>
              <p className="pos-kv"><b>Branch ID:</b> {sale.branch_id}</p>
              <p className="pos-kv"><b>Processed By:</b> {sale.processed_by}</p>
            </div>
          </div>

          {sale.sales_items?.length > 0 && (
            <>
              <p className="pos-section-title" style={{ marginTop:16, marginBottom:8 }}>Items</p>
              <div className="pos-cart-table-wrap">
                <table className="pos-cart-table">
                  <thead><tr><th>Product ID</th><th>Batch</th><th>Qty</th><th>Price</th><th>Discount</th><th>Total</th></tr></thead>
                  <tbody>
                    {sale.sales_items.map((item, i) => (
                      <tr key={i}>
                        <td>#{item.product_id}</td>
                        <td>{item.batch_id || '—'}</td>
                        <td>{item.quantity_sold}</td>
                        <td>₹{parseFloat(item.selling_price).toFixed(2)}</td>
                        <td>₹{parseFloat(item.discount||0).toFixed(2)}</td>
                        <td>₹{parseFloat(item.total_price||0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {sale.payments?.length > 0 && (
            <>
              <p className="pos-section-title" style={{ marginTop:16, marginBottom:8 }}>Payments</p>
              <div className="pos-cart-table-wrap">
                <table className="pos-cart-table">
                  <thead><tr><th>Method</th><th>Amount</th><th>Status</th><th>Reference</th></tr></thead>
                  <tbody>
                    {sale.payments.map((p, i) => (
                      <tr key={i}>
                        <td>{p.payment_method}</td>
                        <td>₹{parseFloat(p.amount).toFixed(2)}</td>
                        <td><span className={`pos-status-badge ${p.payment_status}`}>{p.payment_status}</span></td>
                        <td>{p.payment_reference || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REFUND TAB
// ═══════════════════════════════════════════════════════════════════════════════
function RefundTab() {
  const [txnId, setTxnId]   = useState('');
  const [sale, setSale]     = useState(null);
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('PARTIAL');
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [msg, setMsg] = useState({ type:'', text:'' });

  const fetchSale = async () => {
    if (!txnId.trim()) return;
    setFetching(true); setSale(null); setItems([]);
    try {
      const r = await getSale(parseInt(txnId));
      setSale(r.data);
      // Pre-populate refund items from sale items
      setItems((r.data.sales_items || []).map(si => ({
        product_id: si.product_id,
        batch_id:   si.batch_id,
        quantity:   0,
        max_qty:    si.quantity_sold,
        amount:     0,
        max_amount: parseFloat(si.total_price || 0),
      })));
    } catch (err) {
      setMsg({ type:'error', text: err?.response?.data?.message || 'Sale not found.' });
    } finally { setFetching(false); }
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: parseFloat(value) || 0 };
      return next;
    });
  };

  const handleRefund = async () => {
    const refundItems = items.filter(i => i.quantity > 0);
    if (refundItems.length === 0) { setMsg({ type:'error', text:'Select at least one item to refund.' }); return; }
    if (!reason.trim()) { setMsg({ type:'error', text:'Reason is required.' }); return; }
    setLoading(true);
    try {
      const payload = {
        transaction_id: parseInt(txnId),
        reason,
        status,
        items: refundItems.map(i => ({
          product_id: i.product_id,
          batch_id:   i.batch_id || undefined,
          quantity:   i.quantity,
          amount:     i.amount,
        })),
      };
      await createRefund(payload);
      setMsg({ type:'success', text:'Refund processed successfully.' });
      setSale(null); setItems([]); setTxnId(''); setReason('');
    } catch (err) {
      setMsg({ type:'error', text: err?.response?.data?.message || 'Refund failed.' });
    } finally { setLoading(false); }
  };

  return (
    <div className="pos-tab-content">
      <Toast type={msg.type} msg={msg.text} onClose={() => setMsg({ type:'', text:'' })} />
      <div className="pos-section" style={{ maxWidth:520 }}>
        <div className="pos-section-title">↩️ Process Refund</div>
        <div style={{ display:'flex', gap:8 }}>
          <input style={{ ...inp, flex:1 }} type="number" placeholder="Transaction / Sale ID"
            value={txnId} onChange={e => setTxnId(e.target.value)}
            onKeyDown={e => e.key==='Enter' && fetchSale()} />
          <PosBtn loading={fetching} onClick={fetchSale}>Load Sale</PosBtn>
        </div>
      </div>

      {sale && (
        <div className="pos-section">
          <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:12 }}>
            <span className="pos-section-title">Sale #{String(sale.transaction_id)}</span>
            <span className={`pos-status-badge ${sale.transaction_status}`}>{sale.transaction_status}</span>
            <span style={{ fontSize:'0.8rem', color:'#64748b' }}>Net: ₹{parseFloat(sale.net_amount||0).toFixed(2)}</span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
            <Field label="Refund Reason" required>
              <input style={inp} value={reason} onChange={e => setReason(e.target.value)} placeholder="Defective product, wrong item…" />
            </Field>
            <Field label="Refund Type">
              <select style={sel} value={status} onChange={e => setStatus(e.target.value)}>
                {REFUND_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <p className="pos-section-title" style={{ marginBottom:8 }}>Select Items to Refund</p>
          <div className="pos-cart-table-wrap">
            <table className="pos-cart-table">
              <thead>
                <tr><th>Product ID</th><th>Batch</th><th>Max Qty</th><th>Qty to Refund</th><th>Refund Amount (₹)</th></tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>#{item.product_id}</td>
                    <td>{item.batch_id || '—'}</td>
                    <td>{item.max_qty}</td>
                    <td>
                      <input type="number" min={0} max={item.max_qty}
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', e.target.value)}
                        className="pos-qty-input" />
                    </td>
                    <td>
                      <input type="number" min={0} max={item.max_amount}
                        value={item.amount}
                        onChange={e => updateItem(idx, 'amount', e.target.value)}
                        className="pos-qty-input" style={{ width:90 }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PosBtn variant="warning" loading={loading} onClick={handleRefund} style={{ marginTop:14 }}>
            Process Refund
          </PosBtn>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMERS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function CustomersTab() {
  const [subTab, setSubTab] = useState('view');
  const [custId, setCustId] = useState('');
  const [customer, setCustomer] = useState(null);
  const [history, setHistory]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg] = useState({ type:'', text:'' });

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Feedback
  const [rating, setRating]   = useState(5);
  const [comment, setComment] = useState('');
  const [fbLoading, setFbLoading] = useState(false);

  const loadCustomer = async (id) => {
    if (!id) return;
    setLoading(true); setCustomer(null); setHistory([]); setSummary(null);
    try {
      const [cr, hr, sr] = await Promise.all([
        getCustomer(parseInt(id)),
        getCustomerHistory(parseInt(id)),
        getCustomerSummary(parseInt(id)),
      ]);
      setCustomer(cr.data);
      setHistory(Array.isArray(hr.data) ? hr.data : []);
      setSummary(Array.isArray(sr.data) ? sr.data[0] : sr.data);
      setEditForm(cr.data);
      setMsg({ type:'', text:'' });
    } catch (err) {
      setMsg({ type:'error', text: err?.response?.data?.message || 'Customer not found.' });
    } finally { setLoading(false); }
  };

  const saveEdit = async () => {
    const id = customer.customer_id;
    try {
      const r = await updateCustomer(id, editForm);
      setCustomer(r.data); setEditing(false);
      setMsg({ type:'success', text:'Customer updated.' });
    } catch (err) {
      setMsg({ type:'error', text: err?.response?.data?.message || 'Update failed.' });
    }
  };

  const submitFeedbackFn = async () => {
    if (!customer) return;
    setFbLoading(true);
    try {
      await submitFeedback({ customer_id: customer.customer_id, rating: parseInt(rating), comments: comment });
      setMsg({ type:'success', text:'Feedback submitted.' });
      setRating(5); setComment('');
    } catch (err) {
      setMsg({ type:'error', text: err?.response?.data?.message || 'Failed to submit feedback.' });
    } finally { setFbLoading(false); }
  };

  // New customer
  const [newForm, setNewForm] = useState({ first_name:'', last_name:'', phone:'', email:'', address:'', city:'', country:'' });
  const [creating, setCreating] = useState(false);

  const createCust = async (e) => {
    e.preventDefault();
    if (!newForm.first_name.trim()) { setMsg({ type:'error', text:'First name is required.' }); return; }
    setCreating(true);
    try {
      const r = await createCustomer(newForm);
      setMsg({ type:'success', text:`Customer "${r.data.first_name} ${r.data.last_name}" created! ID: #${r.data.customer_id}` });
      setNewForm({ first_name:'', last_name:'', phone:'', email:'', address:'', city:'', country:'' });
      setSubTab('view');
      setCustId(String(r.data.customer_id));
      loadCustomer(r.data.customer_id);
    } catch (err) {
      setMsg({ type:'error', text: err?.response?.data?.message || 'Failed to create.' });
    } finally { setCreating(false); }
  };

  return (
    <div className="pos-tab-content">
      <Toast type={msg.type} msg={msg.text} onClose={() => setMsg({ type:'', text:'' })} />

      <div className="pos-subtabs">
        {[
          { key:'view',   label:'🔍 View Customer' },
          { key:'create', label:'＋ New Customer' },
        ].map(t => (
          <button key={t.key}
            className={`pos-subtab ${subTab===t.key?'active':''}`}
            onClick={() => setSubTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {subTab === 'create' && (
        <div className="pos-section" style={{ maxWidth:620 }}>
          <div className="pos-section-title">Create New Customer</div>
          <form onSubmit={createCust}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Field label="First Name" required><input style={inp} value={newForm.first_name} onChange={e => setNewForm(p=>({...p,first_name:e.target.value}))} /></Field>
              <Field label="Last Name"><input style={inp} value={newForm.last_name} onChange={e => setNewForm(p=>({...p,last_name:e.target.value}))} /></Field>
              <Field label="Phone"><input style={inp} value={newForm.phone} onChange={e => setNewForm(p=>({...p,phone:e.target.value}))} /></Field>
              <Field label="Email"><input style={inp} type="email" value={newForm.email} onChange={e => setNewForm(p=>({...p,email:e.target.value}))} /></Field>
              <Field label="Address"><input style={inp} value={newForm.address} onChange={e => setNewForm(p=>({...p,address:e.target.value}))} /></Field>
              <Field label="City"><input style={inp} value={newForm.city} onChange={e => setNewForm(p=>({...p,city:e.target.value}))} /></Field>
              <Field label="Country"><input style={inp} value={newForm.country} onChange={e => setNewForm(p=>({...p,country:e.target.value}))} /></Field>
            </div>
            <PosBtn type="submit" loading={creating} style={{ marginTop:10 }}>Create Customer</PosBtn>
          </form>
        </div>
      )}

      {subTab === 'view' && (
        <>
          <div className="pos-section" style={{ maxWidth:400 }}>
            <div className="pos-section-title">Look Up Customer</div>
            <div style={{ display:'flex', gap:8 }}>
              <input style={{ ...inp, flex:1 }} type="number" placeholder="Customer ID"
                value={custId} onChange={e => setCustId(e.target.value)}
                onKeyDown={e => e.key==='Enter' && loadCustomer(custId)} />
              <PosBtn loading={loading} onClick={() => loadCustomer(custId)}>Load</PosBtn>
            </div>
          </div>

          {customer && (
            <div className="pos-cust-detail">
              {/* Profile */}
              <div className="pos-section">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div className="pos-section-title">👤 {customer.first_name} {customer.last_name}</div>
                  <PosBtn size="sm" variant="outline" onClick={() => setEditing(!editing)}>
                    {editing ? 'Cancel' : '✏️ Edit'}
                  </PosBtn>
                </div>

                {editing ? (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
                    <Field label="First Name"><input style={inp} value={editForm.first_name||''} onChange={e=>setEditForm(p=>({...p,first_name:e.target.value}))} /></Field>
                    <Field label="Last Name"><input style={inp} value={editForm.last_name||''} onChange={e=>setEditForm(p=>({...p,last_name:e.target.value}))} /></Field>
                    <Field label="Phone"><input style={inp} value={editForm.phone||''} onChange={e=>setEditForm(p=>({...p,phone:e.target.value}))} /></Field>
                    <Field label="Email"><input style={inp} type="email" value={editForm.email||''} onChange={e=>setEditForm(p=>({...p,email:e.target.value}))} /></Field>
                    <Field label="Address"><input style={inp} value={editForm.address||''} onChange={e=>setEditForm(p=>({...p,address:e.target.value}))} /></Field>
                    <Field label="City"><input style={inp} value={editForm.city||''} onChange={e=>setEditForm(p=>({...p,city:e.target.value}))} /></Field>
                    <PosBtn variant="success" onClick={saveEdit} style={{ gridColumn:'span 2' }}>Save Changes</PosBtn>
                  </div>
                ) : (
                  <div className="pos-detail-grid">
                    <div>
                      <p className="pos-kv"><b>ID:</b> #{customer.customer_id}</p>
                      <p className="pos-kv"><b>Email:</b> {customer.email || '—'}</p>
                      <p className="pos-kv"><b>Phone:</b> {customer.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="pos-kv"><b>City:</b> {customer.city || '—'}</p>
                      <p className="pos-kv"><b>Country:</b> {customer.country || '—'}</p>
                      <p className="pos-kv"><b>Active:</b> {customer.is_active ? '✅' : '❌'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Lifetime summary */}
              {summary && (
                <div className="pos-section">
                  <div className="pos-section-title">📊 Lifetime Summary</div>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    <div className="pos-stat-card">
                      <span className="pos-stat-val">{summary.total_transactions || 0}</span>
                      <span className="pos-stat-label">Total Transactions</span>
                    </div>
                    <div className="pos-stat-card">
                      <span className="pos-stat-val">₹{parseFloat(summary.total_spent||0).toFixed(2)}</span>
                      <span className="pos-stat-label">Total Spent</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Purchase history */}
              <div className="pos-section">
                <div className="pos-section-title">🧾 Purchase History ({history.length})</div>
                {history.length === 0 ? (
                  <p className="pos-empty">No purchases found.</p>
                ) : (
                  <div className="pos-cart-table-wrap">
                    <table className="pos-cart-table">
                      <thead><tr><th>ID</th><th>Date</th><th>Items</th><th>Net Amount</th><th>Status</th></tr></thead>
                      <tbody>
                        {history.slice(0,20).map((t, i) => (
                          <tr key={i}>
                            <td>#{String(t.transaction_id)}</td>
                            <td style={{ fontSize:'0.8rem' }}>{new Date(t.transaction_date).toLocaleDateString()}</td>
                            <td>{t.sales_items?.length || 0}</td>
                            <td>₹{parseFloat(t.net_amount||0).toFixed(2)}</td>
                            <td><span className={`pos-status-badge ${t.transaction_status}`}>{t.transaction_status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Feedback */}
              <div className="pos-section">
                <div className="pos-section-title">⭐ Add Feedback</div>
                <div style={{ display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
                  <Field label="Rating (1–5)" style={{ marginBottom:0 }}>
                    <select style={{ ...sel, width:90 }} value={rating} onChange={e => setRating(e.target.value)}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ★</option>)}
                    </select>
                  </Field>
                  <Field label="Comments" style={{ flex:1, marginBottom:0 }}>
                    <input style={{ ...inp, flex:1 }} value={comment} onChange={e => setComment(e.target.value)} placeholder="Feedback comment…" />
                  </Field>
                  <PosBtn variant="outline" loading={fbLoading} onClick={submitFeedbackFn} style={{ marginBottom:13 }}>Submit</PosBtn>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN POS PANEL
// ═══════════════════════════════════════════════════════════════════════════════
export default function POSPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="pos-root">
      <style>{`
        @keyframes pos-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div className="pos-header">
        <div>
          <h1 className="pos-header-title">Point of Sale</h1>
          <p className="pos-header-sub">Branch #{DEFAULT_BRANCH} · Operator: {user?.username || '—'}</p>
        </div>
        <div className="pos-header-badge">🧾 SmartMart POS</div>
      </div>

      {/* Tabs */}
      <div className="pos-tabs">
        {TABS.map((t, i) => (
          <button key={t.key}
            className={`pos-tab-btn ${activeTab===i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="pos-panel-content">
        {activeTab === 0 && <BillingTab user={user} />}
        {activeTab === 1 && <LookupTab />}
        {activeTab === 2 && <RefundTab />}
        {activeTab === 3 && <CustomersTab />}
      </div>
    </div>
  );
}
