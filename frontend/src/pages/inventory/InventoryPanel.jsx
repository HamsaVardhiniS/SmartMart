import { useState, useEffect } from 'react';
import {
  createProduct, getProducts, updateProduct, updateReorderLevel, updateTaxRate,
  createBrand, getBrands, createCategory, getCategories, createSubcategory, getSubcategories,
  createBatch, adjustStock, getStock,
  getLowStockReport, getExpiryReport, getDeadStockReport, getValuationReport
} from '../../api/inventory.api';
import { confirmCriticalAction } from '../../lib/confirm';

const TABS = ['Products', 'Brands & Categories', 'Batches', 'Stock', 'Reports'];

function Alert({ type, msg, onClose }) {
  if (!msg) return null;
  return (
    <div className={`alert alert-${type}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>✕</button>
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    product_name: '', brand_id: '', category_id: '', subcategory_id: '',
    unit_price: '', tax_rate: '', reorder_level: ''
  });
  const [reorderForm, setReorderForm] = useState({ id: '', reorder_level: '' });
  const [taxForm, setTaxForm] = useState({ id: '', tax_rate: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch { setProducts([]); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.product_name || !form.brand_id || !form.category_id || !form.unit_price) {
      setMsg({ type: 'error', text: 'product_name, brand_id, category_id, unit_price are required.' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        product_name: form.product_name,
        brand_id: form.brand_id,
        category_id: form.category_id,
        unit_price: parseFloat(form.unit_price),
      };
      if (form.subcategory_id) payload.subcategory_id = form.subcategory_id;
      if (form.tax_rate) payload.tax_rate = parseFloat(form.tax_rate);
      if (form.reorder_level) payload.reorder_level = parseInt(form.reorder_level);
      await createProduct(payload);
      setMsg({ type: 'success', text: `Product "${form.product_name}" created.` });
      setForm({ product_name: '', brand_id: '', category_id: '', subcategory_id: '', unit_price: '', tax_rate: '', reorder_level: '' });
      fetchProducts();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (e) => {
    e.preventDefault();
    if (!reorderForm.id || !reorderForm.reorder_level) return;
    setLoading(true);
    try {
      await updateReorderLevel(reorderForm.id, { reorder_level: parseInt(reorderForm.reorder_level) });
      setMsg({ type: 'success', text: `Reorder level updated for product ${reorderForm.id}.` });
      setReorderForm({ id: '', reorder_level: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTax = async (e) => {
    e.preventDefault();
    if (!taxForm.id || !taxForm.tax_rate) return;
    setLoading(true);
    try {
      await updateTaxRate(taxForm.id, { tax_rate: parseFloat(taxForm.tax_rate) });
      setMsg({ type: 'success', text: `Tax rate updated for product ${taxForm.id}.` });
      setTaxForm({ id: '', tax_rate: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="card">
        <div className="card-header"><h3 className="card-title">Create Product</h3></div>
        <form onSubmit={handleCreate}>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input className="form-input" value={form.product_name} onChange={e => setField('product_name', e.target.value)} placeholder="Product name" />
            </div>
            <div className="form-group">
              <label className="form-label">Brand ID *</label>
              <input className="form-input" value={form.brand_id} onChange={e => setField('brand_id', e.target.value)} placeholder="Brand ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Category ID *</label>
              <input className="form-input" value={form.category_id} onChange={e => setField('category_id', e.target.value)} placeholder="Category ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Subcategory ID</label>
              <input className="form-input" value={form.subcategory_id} onChange={e => setField('subcategory_id', e.target.value)} placeholder="Optional" />
            </div>
            <div className="form-group">
              <label className="form-label">Unit Price (₹) *</label>
              <input className="form-input" type="number" step="0.01" value={form.unit_price} onChange={e => setField('unit_price', e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Tax Rate (%)</label>
              <input className="form-input" type="number" step="0.01" value={form.tax_rate} onChange={e => setField('tax_rate', e.target.value)} placeholder="18" />
            </div>
            <div className="form-group">
              <label className="form-label">Reorder Level</label>
              <input className="form-input" type="number" value={form.reorder_level} onChange={e => setField('reorder_level', e.target.value)} placeholder="10" />
            </div>
          </div>
          <button className="btn btn-primary" disabled={loading}>Create Product</button>
        </form>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Update Reorder Level</h3></div>
          <form onSubmit={handleReorder}>
            <div className="form-group">
              <label className="form-label">Product ID</label>
              <input className="form-input" value={reorderForm.id} onChange={e => setReorderForm(f => ({ ...f, id: e.target.value }))} placeholder="Product ID" />
            </div>
            <div className="form-group">
              <label className="form-label">New Reorder Level</label>
              <input className="form-input" type="number" value={reorderForm.reorder_level} onChange={e => setReorderForm(f => ({ ...f, reorder_level: e.target.value }))} placeholder="Qty" />
            </div>
            <button className="btn btn-warning" disabled={loading}>Update Reorder Level</button>
          </form>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Update Tax Rate</h3></div>
          <form onSubmit={handleTax}>
            <div className="form-group">
              <label className="form-label">Product ID</label>
              <input className="form-input" value={taxForm.id} onChange={e => setTaxForm(f => ({ ...f, id: e.target.value }))} placeholder="Product ID" />
            </div>
            <div className="form-group">
              <label className="form-label">New Tax Rate (%)</label>
              <input className="form-input" type="number" step="0.01" value={taxForm.tax_rate} onChange={e => setTaxForm(f => ({ ...f, tax_rate: e.target.value }))} placeholder="18" />
            </div>
            <button className="btn btn-warning" disabled={loading}>Update Tax Rate</button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Product List</h3>
          <button className="btn btn-secondary btn-sm" onClick={fetchProducts}>Refresh</button>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>ID</th><th>Name</th><th>Brand ID</th><th>Category ID</th><th>Price</th><th>Tax %</th><th>Reorder</th></tr></thead>
            <tbody>
              {products.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8' }}>No products</td></tr>}
              {products.map((p, i) => (
                <tr key={i}>
                  <td>{p.product_id?.toString() || p.id?.toString()}</td>
                  <td className="fw-600">{p.product_name || p.name}</td>
                  <td>{p.brand_id?.toString()}</td>
                  <td>{p.category_id?.toString()}</td>
                  <td>₹{parseFloat(p.unit_price || 0).toFixed(2)}</td>
                  <td>{p.tax_rate || 0}%</td>
                  <td>{p.reorder_level || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Brands & Categories Tab ──────────────────────────────────────────────────
function BrandsCategoriesTab() {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brandName, setBrandName] = useState('');
  const [catName, setCatName] = useState('');
  const [subForm, setSubForm] = useState({ subcategory_name: '', category_id: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchAll = async () => {
    const [b, c, s] = await Promise.allSettled([getBrands(), getCategories(), getSubcategories()]);
    if (b.status === 'fulfilled') setBrands(Array.isArray(b.value.data) ? b.value.data : []);
    if (c.status === 'fulfilled') setCategories(Array.isArray(c.value.data) ? c.value.data : []);
    if (s.status === 'fulfilled') setSubcategories(Array.isArray(s.value.data) ? s.value.data : []);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleBrand = async (e) => {
    e.preventDefault();
    if (!brandName) return;
    setLoading(true);
    try {
      await createBrand({ brand_name: brandName });
      setMsg({ type: 'success', text: `Brand "${brandName}" created.` });
      setBrandName('');
      fetchAll();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCategory = async (e) => {
    e.preventDefault();
    if (!catName) return;
    setLoading(true);
    try {
      await createCategory({ category_name: catName });
      setMsg({ type: 'success', text: `Category "${catName}" created.` });
      setCatName('');
      fetchAll();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSub = async (e) => {
    e.preventDefault();
    if (!subForm.subcategory_name || !subForm.category_id) return;
    setLoading(true);
    try {
      await createSubcategory({ subcategory_name: subForm.subcategory_name, category_id: subForm.category_id });
      setMsg({ type: 'success', text: `Subcategory "${subForm.subcategory_name}" created.` });
      setSubForm({ subcategory_name: '', category_id: '' });
      fetchAll();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="grid-3">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Create Brand</h3></div>
          <form onSubmit={handleBrand}>
            <div className="form-group">
              <label className="form-label">Brand Name</label>
              <input className="form-input" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. Nestle" />
            </div>
            <button className="btn btn-primary" disabled={loading}>Create Brand</button>
          </form>
          <hr className="section-divider" />
          <h4 className="fw-600 mb-2">Brands ({brands.length})</h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {brands.map((b, i) => (
              <div key={i} className="stat-row">
                <span className="text-muted">{b.brand_id?.toString() || b.id?.toString()}</span>
                <span>{b.brand_name || b.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Create Category</h3></div>
          <form onSubmit={handleCategory}>
            <div className="form-group">
              <label className="form-label">Category Name</label>
              <input className="form-input" value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Beverages" />
            </div>
            <button className="btn btn-primary" disabled={loading}>Create Category</button>
          </form>
          <hr className="section-divider" />
          <h4 className="fw-600 mb-2">Categories ({categories.length})</h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {categories.map((c, i) => (
              <div key={i} className="stat-row">
                <span className="text-muted">{c.category_id?.toString() || c.id?.toString()}</span>
                <span>{c.category_name || c.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Create Subcategory</h3></div>
          <form onSubmit={handleSub}>
            <div className="form-group">
              <label className="form-label">Subcategory Name</label>
              <input className="form-input" value={subForm.subcategory_name} onChange={e => setSubForm(f => ({ ...f, subcategory_name: e.target.value }))} placeholder="e.g. Juices" />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Category ID</label>
              <input className="form-input" value={subForm.category_id} onChange={e => setSubForm(f => ({ ...f, category_id: e.target.value }))} placeholder="Category ID" />
            </div>
            <button className="btn btn-primary" disabled={loading}>Create Subcategory</button>
          </form>
          <hr className="section-divider" />
          <h4 className="fw-600 mb-2">Subcategories ({subcategories.length})</h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {subcategories.map((s, i) => (
              <div key={i} className="stat-row">
                <span className="text-muted">{s.subcategory_id?.toString() || s.id?.toString()}</span>
                <span>{s.subcategory_name || s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Batches Tab ──────────────────────────────────────────────────────────────
function BatchesTab() {
  const [batchForm, setBatchForm] = useState({ product_id: '', branch_id: '', quantity: '', expiry_date: '', cost_price: '' });
  const [adjustForm, setAdjustForm] = useState({ product_id: '', branch_id: '', adjustment: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const setBatch = (k, v) => setBatchForm(f => ({ ...f, [k]: v }));
  const setAdj = (k, v) => setAdjustForm(f => ({ ...f, [k]: v }));

  const handleBatch = async (e) => {
    e.preventDefault();
    const { product_id, branch_id, quantity, expiry_date, cost_price } = batchForm;
    if (!product_id || !branch_id || !quantity || !expiry_date || !cost_price) {
      setMsg({ type: 'error', text: 'All batch fields required.' });
      return;
    }
    if (!confirmCriticalAction(`Create a new batch for product ${product_id} in branch ${branch_id}?`)) return;
    setLoading(true);
    try {
      const res = await createBatch({
        product_id, branch_id,
        quantity: parseInt(quantity),
        expiry_date,
        cost_price: parseFloat(cost_price),
      });
      setMsg({ type: 'success', text: `Batch created. ID: ${res.data.batch_id?.toString() || 'Done'}` });
      setBatchForm({ product_id: '', branch_id: '', quantity: '', expiry_date: '', cost_price: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to create batch.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    const { product_id, branch_id, adjustment, reason } = adjustForm;
    if (!product_id || !branch_id || !adjustment || !reason) {
      setMsg({ type: 'error', text: 'All adjustment fields required.' });
      return;
    }
    if (!confirmCriticalAction(`Apply stock adjustment of ${adjustment} for product ${product_id} at branch ${branch_id}?`)) return;
    setLoading(true);
    try {
      await adjustStock({ product_id, branch_id, adjustment: parseInt(adjustment), reason });
      setMsg({ type: 'success', text: `Stock adjusted for product ${product_id} at branch ${branch_id}.` });
      setAdjustForm({ product_id: '', branch_id: '', adjustment: '', reason: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to adjust stock.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Add Batch</h3></div>
          <form onSubmit={handleBatch}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Product ID *</label>
                <input className="form-input" value={batchForm.product_id} onChange={e => setBatch('product_id', e.target.value)} placeholder="Product ID" />
              </div>
              <div className="form-group">
                <label className="form-label">Branch ID *</label>
                <input className="form-input" value={batchForm.branch_id} onChange={e => setBatch('branch_id', e.target.value)} placeholder="Branch ID" />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input className="form-input" type="number" value={batchForm.quantity} onChange={e => setBatch('quantity', e.target.value)} placeholder="Qty" />
              </div>
              <div className="form-group">
                <label className="form-label">Cost Price (₹) *</label>
                <input className="form-input" type="number" step="0.01" value={batchForm.cost_price} onChange={e => setBatch('cost_price', e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Expiry Date *</label>
                <input className="form-input" type="date" value={batchForm.expiry_date} onChange={e => setBatch('expiry_date', e.target.value)} />
              </div>
            </div>
            <button className="btn btn-primary" disabled={loading}>Add Batch</button>
          </form>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Stock Adjustment</h3></div>
          <form onSubmit={handleAdjust}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Product ID *</label>
                <input className="form-input" value={adjustForm.product_id} onChange={e => setAdj('product_id', e.target.value)} placeholder="Product ID" />
              </div>
              <div className="form-group">
                <label className="form-label">Branch ID *</label>
                <input className="form-input" value={adjustForm.branch_id} onChange={e => setAdj('branch_id', e.target.value)} placeholder="Branch ID" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Adjustment (+ or -) *</label>
              <input className="form-input" type="number" value={adjustForm.adjustment} onChange={e => setAdj('adjustment', e.target.value)} placeholder="e.g. -5 or +20" />
            </div>
            <div className="form-group">
              <label className="form-label">Reason *</label>
              <textarea className="form-textarea" value={adjustForm.reason} onChange={e => setAdj('reason', e.target.value)} placeholder="Reason for adjustment..." />
            </div>
            <button className="btn btn-warning" disabled={loading}>Adjust Stock</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Stock Tab ────────────────────────────────────────────────────────────────
function StockTab() {
  const [productId, setProductId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!productId || !branchId) {
      setMsg({ type: 'error', text: 'Both product ID and branch ID required.' });
      return;
    }
    setLoading(true);
    setStockData(null);
    try {
      const res = await getStock(productId, branchId);
      setStockData(res.data);
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Stock not found.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="card" style={{ maxWidth: '520px' }}>
        <div className="card-header"><h3 className="card-title">Query Stock</h3></div>
        <form onSubmit={handleQuery}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Product ID</label>
              <input className="form-input" value={productId} onChange={e => setProductId(e.target.value)} placeholder="Product ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Branch ID</label>
              <input className="form-input" value={branchId} onChange={e => setBranchId(e.target.value)} placeholder="Branch ID" />
            </div>
          </div>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Querying...' : 'Check Stock'}</button>
        </form>
      </div>

      {stockData && (
        <div className="card" style={{ maxWidth: '520px' }}>
          <div className="card-header"><h3 className="card-title">Stock Result</h3></div>
          <div className="kpi-card blue" style={{ marginBottom: 0 }}>
            <div className="kpi-label">Available Quantity</div>
            <div className="kpi-value">{stockData.quantity ?? stockData.available_quantity ?? stockData.total_quantity ?? '—'}</div>
            <div className="text-sm text-muted">Product {productId} @ Branch {branchId}</div>
          </div>
          {Object.entries(stockData).map(([k, v]) => (
            k !== 'quantity' && k !== 'available_quantity' && (
              <div key={k} className="stat-row">
                <span className="text-muted">{k}</span>
                <span>{v?.toString()}</span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab() {
  const [activeReport, setActiveReport] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reports = [
    { key: 'low-stock', label: 'Low Stock', fn: getLowStockReport, color: '#ef4444' },
    { key: 'expiry', label: 'Near Expiry', fn: getExpiryReport, color: '#f59e0b' },
    { key: 'dead-stock', label: 'Dead Stock', fn: getDeadStockReport, color: '#8b5cf6' },
    { key: 'valuation', label: 'Valuation', fn: getValuationReport, color: '#10b981' },
  ];

  const handleReport = async (report) => {
    setActiveReport(report.key);
    setLoading(true);
    setError('');
    setReportData([]);
    try {
      const res = await report.fn();
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setReportData(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  const activeReportDef = reports.find(r => r.key === activeReport);

  return (
    <div>
      <div className="card">
        <div className="card-header"><h3 className="card-title">Inventory Reports</h3></div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {reports.map(r => (
            <button
              key={r.key}
              className="btn"
              style={{
                background: activeReport === r.key ? r.color : '#f1f5f9',
                color: activeReport === r.key ? '#fff' : '#374151',
              }}
              onClick={() => handleReport(r)}
              disabled={loading}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && (
        <div className="card"><p className="text-muted">Loading report...</p></div>
      )}

      {!loading && reportData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ color: activeReportDef?.color }}>
              {activeReportDef?.label} Report
            </h3>
            <span className="badge badge-blue">{reportData.length} items</span>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>{Object.keys(reportData[0]).map(k => <th key={k}>{k}</th>)}</tr>
              </thead>
              <tbody>
                {reportData.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => <td key={j}>{v?.toString() || '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeReport && reportData.length === 0 && !error && (
        <div className="card"><p className="text-muted">No data found for this report.</p></div>
      )}
    </div>
  );
}

// ─── Main InventoryPanel ──────────────────────────────────────────────────────
export default function InventoryPanel() {
  const [activeTab, setActiveTab] = useState(0);

  const renderTab = () => {
    switch (activeTab) {
      case 0: return <ProductsTab />;
      case 1: return <BrandsCategoriesTab />;
      case 2: return <BatchesTab />;
      case 3: return <StockTab />;
      case 4: return <ReportsTab />;
      default: return null;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Inventory Management</h2>
        <p className="text-muted text-sm">Manage products, batches, stock levels, and reports.</p>
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
