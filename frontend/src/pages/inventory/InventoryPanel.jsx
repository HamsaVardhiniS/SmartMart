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
  const isError = type === 'error';
  return (
    <div className={`alert ${isError ? 'alert-error' : 'alert-success'}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>✕</button>
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────
function ProductsTab({ brands, categories, subcategories }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    product_name: '', sku: '', barcode: '', brand_id: '', category_id: '', subcategory_id: '',
    unit: '', tax_percentage: '', reorder_level: ''
  });
  const [reorderForm, setReorderForm] = useState({ id: '', reorder_level: '' });
  const [taxForm, setTaxForm] = useState({ id: '', tax_percentage: '' });
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
    if (!form.product_name) {
      setMsg({ type: 'error', text: 'product_name is required.' });
      return;
    }
    setLoading(true);
    try {
      const payload = { product_name: form.product_name };
      if (form.sku) payload.sku = form.sku;
      if (form.barcode) payload.barcode = form.barcode;
      if (form.brand_id) payload.brand_id = parseInt(form.brand_id);
      if (form.category_id) payload.category_id = parseInt(form.category_id);
      if (form.subcategory_id) payload.subcategory_id = parseInt(form.subcategory_id);
      if (form.unit) payload.unit = form.unit;
      if (form.tax_percentage) payload.tax_percentage = parseFloat(form.tax_percentage);
      if (form.reorder_level) payload.reorder_level = parseInt(form.reorder_level);
      
      await createProduct(payload);
      setMsg({ type: 'success', text: `Product "${form.product_name}" created.` });
      setForm({ product_name: '', sku: '', barcode: '', brand_id: '', category_id: '', subcategory_id: '', unit: '', tax_percentage: '', reorder_level: '' });
      fetchProducts();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to create product.' });
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
      fetchProducts();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTax = async (e) => {
    e.preventDefault();
    if (!taxForm.id || !taxForm.tax_percentage) return;
    setLoading(true);
    try {
      await updateTaxRate(taxForm.id, { tax_percentage: parseFloat(taxForm.tax_percentage) });
      setMsg({ type: 'success', text: `Tax rate updated for product ${taxForm.id}.` });
      setTaxForm({ id: '', tax_percentage: '' });
      fetchProducts();
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-content">
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="adm-card">
        <div className="adm-card-header"><h3 className="adm-card-title">Create Product</h3></div>
        <form onSubmit={handleCreate}>
          <div className="adm-grid-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="adm-field">
              <label className="adm-label">Product Name <span className="adm-required">*</span></label>
              <input className="adm-input" value={form.product_name} onChange={e => setField('product_name', e.target.value)} placeholder="Product name" />
            </div>
            <div className="adm-field">
              <label className="adm-label">Brand</label>
              <select className="adm-select" value={form.brand_id} onChange={e => setField('brand_id', e.target.value)}>
                <option value="">-- Select Brand --</option>
                {brands.map(b => (
                  <option key={b.brand_id} value={b.brand_id}>{b.brand_name || b.name}</option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-label">Category</label>
              <select className="adm-select" value={form.category_id} onChange={e => setField('category_id', e.target.value)}>
                <option value="">-- Select Category --</option>
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name || c.name}</option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-label">Subcategory</label>
              <select className="adm-select" value={form.subcategory_id} onChange={e => setField('subcategory_id', e.target.value)}>
                <option value="">-- Select Subcategory --</option>
                {subcategories.filter(s => !form.category_id || s.category_id?.toString() === form.category_id).map(s => (
                  <option key={s.subcategory_id} value={s.subcategory_id}>{s.subcategory_name || s.name}</option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-label">SKU</label>
              <input className="adm-input" value={form.sku} onChange={e => setField('sku', e.target.value)} placeholder="Auto-generated if blank" />
            </div>
            <div className="adm-field">
              <label className="adm-label">Barcode</label>
              <input className="adm-input" value={form.barcode} onChange={e => setField('barcode', e.target.value)} placeholder="Barcode" />
            </div>
            <div className="adm-field">
              <label className="adm-label">Unit</label>
              <input className="adm-input" value={form.unit} onChange={e => setField('unit', e.target.value)} placeholder="e.g. kg, pcs" />
            </div>
            <div className="adm-field">
              <label className="adm-label">Tax (%)</label>
              <input className="adm-input" type="number" step="0.01" value={form.tax_percentage} onChange={e => setField('tax_percentage', e.target.value)} placeholder="18" />
            </div>
            <div className="adm-field">
              <label className="adm-label">Reorder Level</label>
              <input className="adm-input" type="number" value={form.reorder_level} onChange={e => setField('reorder_level', e.target.value)} placeholder="10" />
            </div>
          </div>
          <button className="adm-btn adm-btn-primary adm-btn-md mt-2" disabled={loading}>Create Product</button>
        </form>
      </div>

      <div className="adm-grid-2">
        <div className="adm-card">
          <div className="adm-card-header"><h3 className="adm-card-title">Update Reorder Level</h3></div>
          <form onSubmit={handleReorder}>
            <div className="adm-field">
              <label className="adm-label">Select Product <span className="adm-required">*</span></label>
              <select className="adm-select" value={reorderForm.id} onChange={e => setReorderForm(f => ({ ...f, id: e.target.value }))}>
                <option value="">-- Select Product --</option>
                {products.map(p => (
                  <option key={p.product_id} value={p.product_id}>{p.product_name} (ID: {p.product_id})</option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-label">New Reorder Level</label>
              <input className="adm-input" type="number" value={reorderForm.reorder_level} onChange={e => setReorderForm(f => ({ ...f, reorder_level: e.target.value }))} placeholder="Qty" />
            </div>
            <button className="adm-btn adm-btn-warning adm-btn-md mt-2" disabled={loading}>Update Reorder Level</button>
          </form>
        </div>
        <div className="adm-card">
          <div className="adm-card-header"><h3 className="adm-card-title">Update Tax Rate</h3></div>
          <form onSubmit={handleTax}>
            <div className="adm-field">
              <label className="adm-label">Select Product <span className="adm-required">*</span></label>
              <select className="adm-select" value={taxForm.id} onChange={e => setTaxForm(f => ({ ...f, id: e.target.value }))}>
                <option value="">-- Select Product --</option>
                {products.map(p => (
                  <option key={p.product_id} value={p.product_id}>{p.product_name} (ID: {p.product_id})</option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-label">New Tax Rate (%)</label>
              <input className="adm-input" type="number" step="0.01" value={taxForm.tax_percentage} onChange={e => setTaxForm(f => ({ ...f, tax_percentage: e.target.value }))} placeholder="18" />
            </div>
            <button className="adm-btn adm-btn-warning adm-btn-md mt-2" disabled={loading}>Update Tax Rate</button>
          </form>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card-header">
          <h3 className="adm-card-title">Product List</h3>
          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={fetchProducts}>Refresh</button>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>ID</th><th>SKU</th><th>Name</th><th>Brand</th><th>Category</th><th>Unit</th><th>Tax %</th><th>Reorder</th></tr></thead>
            <tbody>
              {products.length === 0 && <tr><td colSpan={8} className="adm-empty">No products found</td></tr>}
              {products.map((p, i) => (
                <tr key={i}>
                  <td><span className="adm-id-chip">{p.product_id?.toString() || p.id}</span></td>
                  <td>{p.sku || '—'}</td>
                  <td className="fw-600">{p.product_name || p.name}</td>
                  <td>{p.brand?.brand_name || p.brand_id?.toString() || '—'}</td>
                  <td>{p.category?.category_name || p.category_id?.toString() || '—'}</td>
                  <td>{p.unit || '—'}</td>
                  <td>{p.tax_percentage || p.tax_rate || 0}%</td>
                  <td><span className="adm-badge adm-badge-blue">{p.reorder_level || 0}</span></td>
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
function BrandsCategoriesTab({ brands, categories, subcategories, fetchAll }) {
  const [brandName, setBrandName] = useState('');
  const [catName, setCatName] = useState('');
  const [subForm, setSubForm] = useState({ subcategory_name: '', category_id: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

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
      await createSubcategory({ subcategory_name: subForm.subcategory_name, category_id: parseInt(subForm.category_id) });
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
    <div className="adm-content">
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="adm-grid-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="adm-card">
          <div className="adm-card-header"><h3 className="adm-card-title">Create Brand</h3></div>
          <form onSubmit={handleBrand}>
            <div className="adm-field">
              <label className="adm-label">Brand Name</label>
              <input className="adm-input" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. Nestle" />
            </div>
            <button className="adm-btn adm-btn-primary adm-btn-md mt-2" disabled={loading}>Create Brand</button>
          </form>
          <hr className="section-divider" style={{ borderColor: '#dbeafe' }} />
          <h4 className="adm-card-title" style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Existing Brands ({brands.length})</h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {brands.map((b, i) => (
              <div key={i} className="stat-row">
                <span className="adm-id-chip">{b.brand_id?.toString() || b.id}</span>
                <span className="fw-600 ml-2" style={{ color: '#1e3a8a'}}>{b.brand_name || b.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="adm-card">
          <div className="adm-card-header"><h3 className="adm-card-title">Create Category</h3></div>
          <form onSubmit={handleCategory}>
            <div className="adm-field">
              <label className="adm-label">Category Name</label>
              <input className="adm-input" value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Beverages" />
            </div>
            <button className="adm-btn adm-btn-primary adm-btn-md mt-2" disabled={loading}>Create Category</button>
          </form>
          <hr className="section-divider" style={{ borderColor: '#dbeafe' }} />
          <h4 className="adm-card-title" style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Existing Categories ({categories.length})</h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {categories.map((c, i) => (
              <div key={i} className="stat-row">
                <span className="adm-id-chip">{c.category_id?.toString() || c.id}</span>
                <span className="fw-600 ml-2" style={{ color: '#1e3a8a'}}>{c.category_name || c.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="adm-card">
          <div className="adm-card-header"><h3 className="adm-card-title">Create Subcategory</h3></div>
          <form onSubmit={handleSub}>
            <div className="adm-field">
              <label className="adm-label">Subcategory Name</label>
              <input className="adm-input" value={subForm.subcategory_name} onChange={e => setSubForm(f => ({ ...f, subcategory_name: e.target.value }))} placeholder="e.g. Juices" />
            </div>
            <div className="adm-field">
              <label className="adm-label">Parent Category</label>
              <select className="adm-select" value={subForm.category_id} onChange={e => setSubForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">-- Select Category --</option>
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name || c.name}</option>
                ))}
              </select>
            </div>
            <button className="adm-btn adm-btn-primary adm-btn-md mt-2" disabled={loading}>Create Subcategory</button>
          </form>
          <hr className="section-divider" style={{ borderColor: '#dbeafe' }} />
          <h4 className="adm-card-title" style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Existing Subcategories ({subcategories.length})</h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {subcategories.map((s, i) => (
              <div key={i} className="stat-row">
                <span className="adm-id-chip">{s.subcategory_id?.toString() || s.id}</span>
                <span className="fw-600 ml-2" style={{ color: '#1e3a8a'}}>{s.subcategory_name || s.name}</span>
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
  const [products, setProducts] = useState([]);
  const [batchForm, setBatchForm] = useState({ product_id: '', branch_id: '', quantity: '', expiry_date: '' });
  const [adjustForm, setAdjustForm] = useState({ product_id: '', branch_id: '', batch_id: '', quantity: '', movement_type: 'ADJUSTMENT', reference_id: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    getProducts().then(res => setProducts(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, []);

  const setBatch = (k, v) => setBatchForm(f => ({ ...f, [k]: v }));
  const setAdj = (k, v) => setAdjustForm(f => ({ ...f, [k]: v }));

  const handleBatch = async (e) => {
    e.preventDefault();
    const { product_id, branch_id, quantity, expiry_date } = batchForm;
    if (!product_id || !branch_id || !quantity || !expiry_date) {
      setMsg({ type: 'error', text: 'All batch fields are required for new batch.' });
      return;
    }
    if (!confirmCriticalAction(`Create a new batch for product ${product_id} in branch ${branch_id}?`)) return;
    setLoading(true);
    try {
      const res = await createBatch({
        product_id: parseInt(product_id),
        branch_id: parseInt(branch_id),
        quantity: parseInt(quantity),
        expiry_date: new Date(expiry_date).toISOString()
      });
      setMsg({ type: 'success', text: `Batch created.` });
      setBatchForm({ product_id: '', branch_id: '', quantity: '', expiry_date: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to create batch.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    const { product_id, branch_id, batch_id, quantity, movement_type, reference_id } = adjustForm;
    if (!product_id || !branch_id || !quantity || !movement_type || !batch_id) {
      setMsg({ type: 'error', text: 'product_id, branch_id, batch_id, movement_type, quantity are required for adjustment.' });
      return;
    }
    if (!confirmCriticalAction(`Apply stock adjustment of ${quantity} for product ${product_id} at branch ${branch_id}?`)) return;
    setLoading(true);
    try {
      await adjustStock({
        product_id: parseInt(product_id),
        branch_id: parseInt(branch_id),
        batch_id: parseInt(batch_id),
        quantity: parseInt(quantity),
        movement_type,
        reference_id: reference_id ? parseInt(reference_id) : undefined
      });
      setMsg({ type: 'success', text: `Stock adjusted for product ${product_id} at branch ${branch_id}.` });
      setAdjustForm({ product_id: '', branch_id: '', batch_id: '', quantity: '', movement_type: 'ADJUSTMENT', reference_id: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to adjust stock.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-content">
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="adm-grid-2">
        <div className="adm-card">
          <div className="adm-card-header"><h3 className="adm-card-title">Add Inventory Batch</h3></div>
          <form onSubmit={handleBatch}>
            <div className="adm-grid-2">
              <div className="adm-field">
                <label className="adm-label">Select Product <span className="adm-required">*</span></label>
                <select className="adm-select" value={batchForm.product_id} onChange={e => setBatch('product_id', e.target.value)}>
                  <option value="">-- Select Product --</option>
                  {products.map(p => (
                    <option key={p.product_id} value={p.product_id}>{p.product_name}</option>
                  ))}
                </select>
              </div>
              <div className="adm-field">
                <label className="adm-label">Branch ID <span className="adm-required">*</span></label>
                <input className="adm-input" type="number" value={batchForm.branch_id} onChange={e => setBatch('branch_id', e.target.value)} placeholder="Branch ID" />
              </div>
              <div className="adm-field">
                <label className="adm-label">Initial Quantity <span className="adm-required">*</span></label>
                <input className="adm-input" type="number" min="1" value={batchForm.quantity} onChange={e => setBatch('quantity', e.target.value)} placeholder="Qty" />
              </div>
              <div className="adm-field">
                <label className="adm-label">Expiry Date <span className="adm-required">*</span></label>
                <input className="adm-input" type="date" value={batchForm.expiry_date} onChange={e => setBatch('expiry_date', e.target.value)} />
              </div>
            </div>
            <button className="adm-btn adm-btn-primary adm-btn-md mt-2" disabled={loading}>Record Batch Entry</button>
          </form>
        </div>

        <div className="adm-card">
          <div className="adm-card-header"><h3 className="adm-card-title">Stock Adjustment / Movement</h3></div>
          <form onSubmit={handleAdjust}>
            <div className="adm-grid-2">
              <div className="adm-field">
                <label className="adm-label">Product ID <span className="adm-required">*</span></label>
                <select className="adm-select" value={adjustForm.product_id} onChange={e => setAdj('product_id', e.target.value)}>
                  <option value="">-- Select Product --</option>
                  {products.map(p => (
                    <option key={p.product_id} value={p.product_id}>{p.product_name}</option>
                  ))}
                </select>
              </div>
              <div className="adm-field">
                <label className="adm-label">Branch ID <span className="adm-required">*</span></label>
                <input className="adm-input" type="number" value={adjustForm.branch_id} onChange={e => setAdj('branch_id', e.target.value)} placeholder="Branch ID" />
              </div>
              <div className="adm-field">
                <label className="adm-label">Batch ID <span className="adm-required">*</span></label>
                <input className="adm-input" type="number" value={adjustForm.batch_id} onChange={e => setAdj('batch_id', e.target.value)} placeholder="Target Batch ID" />
              </div>
              <div className="adm-field">
                <label className="adm-label">Adjustment Quantity (+/-) <span className="adm-required">*</span></label>
                <input className="adm-input" type="number" value={adjustForm.quantity} onChange={e => setAdj('quantity', e.target.value)} placeholder="e.g. 5 or -2" />
              </div>
              <div className="adm-field">
                <label className="adm-label">Movement Type <span className="adm-required">*</span></label>
                <select className="adm-select" value={adjustForm.movement_type} onChange={e => setAdj('movement_type', e.target.value)}>
                  <option value="ADJUSTMENT">ADJUSTMENT</option>
                  <option value="RETURN">RETURN</option>
                  <option value="DAMAGE">DAMAGE</option>
                  <option value="LOSS">LOSS</option>
                </select>
              </div>
              <div className="adm-field">
                <label className="adm-label">Reference ID <span className="adm-required"></span></label>
                <input className="adm-input" type="number" value={adjustForm.reference_id} onChange={e => setAdj('reference_id', e.target.value)} placeholder="Optional ref" />
              </div>
            </div>
            <button className="adm-btn adm-btn-warning adm-btn-md mt-2" disabled={loading}>Commit Adjustment</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Stock Tab ────────────────────────────────────────────────────────────────
function StockTab() {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    getProducts().then(res => setProducts(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, []);

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!productId || !branchId) {
      setMsg({ type: 'error', text: 'Both product and branch required.' });
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
    <div className="adm-content">
      <Alert type={msg.type} msg={msg.text} onClose={() => setMsg({ type: '', text: '' })} />
      <div className="adm-card" style={{ maxWidth: '600px' }}>
        <div className="adm-card-header"><h3 className="adm-card-title">Query Inventory Stock</h3></div>
        <form onSubmit={handleQuery}>
          <div className="adm-grid-2">
            <div className="adm-field">
              <label className="adm-label">Select Product</label>
              <select className="adm-select" value={productId} onChange={e => setProductId(e.target.value)}>
                <option value="">-- Select Product --</option>
                {products.map(p => (
                  <option key={p.product_id} value={p.product_id}>{p.product_name}</option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-label">Branch ID</label>
              <input className="adm-input" type="number" value={branchId} onChange={e => setBranchId(e.target.value)} placeholder="Branch ID" />
            </div>
          </div>
          <button className="adm-btn adm-btn-primary adm-btn-md mt-2" disabled={loading}>{loading ? 'Querying...' : 'Check Stock Level'}</button>
        </form>
      </div>

      {stockData && (
        <div className="adm-card" style={{ maxWidth: '600px' }}>
          <div className="adm-card-header"><h3 className="adm-card-title">Stock Result</h3></div>
          <div className="adm-flag-stat adm-flag-stat-blue" style={{ marginBottom: '16px' }}>
            <span className="adm-flag-stat-val">{stockData.total_stock ?? '—'}</span>
            <span className="adm-flag-stat-label">Total Stock Available</span>
          </div>
          <div className="stat-row">
            <span className="text-muted">Product ID</span>
            <span>{stockData.product?.toString()}</span>
          </div>
          <div className="stat-row">
            <span className="text-muted">Branch ID</span>
            <span>{stockData.branch?.toString()}</span>
          </div>
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
    { key: 'low-stock', label: 'Low Stock Alerts', fn: getLowStockReport, color: 'adm-btn-danger' },
    { key: 'expiry', label: 'Near Expiry', fn: getExpiryReport, color: 'adm-btn-warning' },
    { key: 'dead-stock', label: 'Dead Stock', fn: getDeadStockReport, color: 'adm-btn-primary' },
    { key: 'valuation', label: 'Stock Valuation', fn: getValuationReport, color: 'adm-btn-success' },
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
    <div className="adm-content">
      <div className="adm-card">
        <div className="adm-card-header"><h3 className="adm-card-title">Inventory Reports</h3></div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {reports.map(r => (
            <button
              key={r.key}
              className={`adm-btn ${r.color} adm-btn-md`}
              style={{ opacity: activeReport && activeReport !== r.key ? 0.6 : 1 }}
              onClick={() => handleReport(r)}
              disabled={loading}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && <Alert type="error" msg={error} onClose={() => setError('')} />}

      {loading && (
        <div className="adm-card">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="adm-spinner" style={{ borderColor: 'rgba(37,99,235,0.3)', borderTopColor: '#2563eb' }}></div>
            <span className="text-muted">Loading report...</span>
          </div>
        </div>
      )}

      {!loading && reportData.length > 0 && (
        <div className="adm-card">
          <div className="adm-card-header">
            <h3 className="adm-card-title">{activeReportDef?.label}</h3>
            <span className="adm-badge adm-badge-blue">{reportData.length} entries</span>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>{Object.keys(reportData[0]).map(k => <th key={k}>{k.replace(/_/g, ' ')}</th>)}</tr>
              </thead>
              <tbody>
                {reportData.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => <td key={j}>{v !== null && v !== undefined ? v.toString() : '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeReport && reportData.length === 0 && !error && (
        <div className="adm-card"><p className="adm-empty">No data found for this report.</p></div>
      )}
    </div>
  );
}

// ─── Main InventoryPanel ──────────────────────────────────────────────────────
export default function InventoryPanel() {
  const [activeTab, setActiveTab] = useState(0);

  // Common relational data to pass down
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const fetchAll = async () => {
    const [b, c, s] = await Promise.allSettled([getBrands(), getCategories(), getSubcategories()]);
    if (b.status === 'fulfilled') setBrands(Array.isArray(b.value.data) ? b.value.data : []);
    if (c.status === 'fulfilled') setCategories(Array.isArray(c.value.data) ? c.value.data : []);
    if (s.status === 'fulfilled') setSubcategories(Array.isArray(s.value.data) ? s.value.data : []);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 0: return <ProductsTab brands={brands} categories={categories} subcategories={subcategories} />;
      case 1: return <BrandsCategoriesTab brands={brands} categories={categories} subcategories={subcategories} fetchAll={fetchAll} />;
      case 2: return <BatchesTab />;
      case 3: return <StockTab />;
      case 4: return <ReportsTab />;
      default: return null;
    }
  };

  return (
    <div className="adm-root" style={{ height: '100%' }}>
      <div className="adm-hero">
        <div>
          <h2 className="adm-hero-title">Inventory Command Center</h2>
          <p className="adm-hero-sub">Full control over products, relational stock categories, robust batching, and adjustments.</p>
        </div>
        <div className="adm-hero-badge">📦 Live System</div>
      </div>

      <div className="adm-tabs">
        {TABS.map((tab, i) => (
          <button key={i} className={`adm-tab ${activeTab === i ? 'adm-tab-active' : ''}`} onClick={() => setActiveTab(i)}>
            {tab}
          </button>
        ))}
      </div>
      
      {renderTab()}
    </div>
  );
}
