import { useState, useEffect } from 'react';
import {
  getRevenue, getProductsAnalytics, getInventoryAnalytics,
  getPayrollAnalytics, getSuppliersAnalytics
} from '../../api/analytics.api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

function KPICard({ label, value, color, icon }) {
  return (
    <div className={`kpi-card ${color}`}>
      {icon && <div style={{ fontSize: '1.4rem' }}>{icon}</div>}
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

function DataTable({ data, title }) {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="card">
        <div className="card-header"><h3 className="card-title">{title}</h3></div>
        <p className="text-muted">No data available.</p>
      </div>
    );
  }

  const rows = Array.isArray(data) ? data : (data.data || [data]);
  if (rows.length === 0) return null;
  const keys = Object.keys(rows[0]);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <span className="badge badge-blue">{rows.length} records</span>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead><tr>{keys.map(k => <th key={k}>{k}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {keys.map(k => <td key={k}>{row[k]?.toString() ?? '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RevenueSection({ data }) {
  if (!data) return null;
  const rows = Array.isArray(data) ? data : (data.revenue || data.data || []);
  const summary = !Array.isArray(data) ? data : null;

  const kpis = [];
  if (summary) {
    if (summary.total_revenue !== undefined) kpis.push({ label: 'Total Revenue', value: `₹${parseFloat(summary.total_revenue).toFixed(0)}`, color: 'teal' });
    if (summary.total_sales !== undefined) kpis.push({ label: 'Total Sales', value: summary.total_sales, color: 'blue' });
    if (summary.avg_order_value !== undefined) kpis.push({ label: 'Avg Order Value', value: `₹${parseFloat(summary.avg_order_value).toFixed(2)}`, color: 'green' });
    if (summary.net_profit !== undefined) kpis.push({ label: 'Net Profit', value: `₹${parseFloat(summary.net_profit).toFixed(0)}`, color: 'orange' });
  }

  const chartData = rows.slice(0, 30).map(r => ({
    name: r.date || r.month || r.period || r.label || '',
    revenue: parseFloat(r.revenue || r.total || r.amount || 0),
    sales: parseInt(r.count || r.sales || r.quantity || 0),
  }));

  return (
    <div>
      {kpis.length > 0 && (
        <div className="kpi-grid">
          {kpis.map((k, i) => <KPICard key={i} {...k} />)}
        </div>
      )}
      {chartData.length > 0 && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Revenue Trend</h3></div>
          <div className="chart-container" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n) => [n === 'revenue' ? `₹${v.toFixed(2)}` : v, n]} />
                <Legend />
                <Bar dataKey="revenue" fill="#14b8a6" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sales" fill="#3b82f6" name="Sales Count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {rows.length > 0 && <DataTable data={rows} title="Revenue Details" />}
    </div>
  );
}

function ProductsSection({ data }) {
  if (!data) return null;
  const rows = Array.isArray(data) ? data : (data.products || data.top_products || data.data || []);
  const summary = !Array.isArray(data) ? data : null;

  const kpis = [];
  if (summary) {
    if (summary.total_products !== undefined) kpis.push({ label: 'Total Products', value: summary.total_products, color: 'blue' });
    if (summary.top_selling_product !== undefined) kpis.push({ label: 'Top Product', value: summary.top_selling_product, color: 'green' });
    if (summary.total_units_sold !== undefined) kpis.push({ label: 'Units Sold', value: summary.total_units_sold, color: 'teal' });
  }

  const chartData = rows.slice(0, 10).map(r => ({
    name: (r.product_name || r.name || r.product_id?.toString() || '').slice(0, 15),
    quantity: parseInt(r.total_quantity || r.quantity_sold || r.units || r.count || 0),
    revenue: parseFloat(r.total_revenue || r.revenue || r.amount || 0),
  }));

  return (
    <div>
      {kpis.length > 0 && (
        <div className="kpi-grid">
          {kpis.map((k, i) => <KPICard key={i} {...k} />)}
        </div>
      )}
      {chartData.length > 0 && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Top Products by Sales</h3></div>
          <div className="chart-container" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantity" fill="#3b82f6" name="Units Sold" />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {rows.length > 0 && <DataTable data={rows} title="Product Analytics" />}
    </div>
  );
}

function InventorySection({ data }) {
  if (!data) return null;
  const rows = Array.isArray(data) ? data : (data.inventory || data.data || []);
  const summary = !Array.isArray(data) ? data : null;

  const kpis = [];
  if (summary) {
    if (summary.total_value !== undefined) kpis.push({ label: 'Total Inventory Value', value: `₹${parseFloat(summary.total_value).toFixed(0)}`, color: 'blue' });
    if (summary.low_stock_count !== undefined) kpis.push({ label: 'Low Stock Items', value: summary.low_stock_count, color: 'red' });
    if (summary.total_items !== undefined) kpis.push({ label: 'Total SKUs', value: summary.total_items, color: 'teal' });
    if (summary.expiring_soon !== undefined) kpis.push({ label: 'Expiring Soon', value: summary.expiring_soon, color: 'orange' });
  }

  return (
    <div>
      {kpis.length > 0 && (
        <div className="kpi-grid">
          {kpis.map((k, i) => <KPICard key={i} {...k} />)}
        </div>
      )}
      {rows.length > 0 && <DataTable data={rows} title="Inventory Details" />}
    </div>
  );
}

function PayrollSection({ data }) {
  if (!data) return null;
  const rows = Array.isArray(data) ? data : (data.payroll || data.employees || data.data || []);
  const summary = !Array.isArray(data) ? data : null;

  const kpis = [];
  if (summary) {
    if (summary.total_payroll !== undefined) kpis.push({ label: 'Total Payroll', value: `₹${parseFloat(summary.total_payroll).toFixed(0)}`, color: 'orange' });
    if (summary.total_employees !== undefined) kpis.push({ label: 'Employees', value: summary.total_employees, color: 'blue' });
    if (summary.avg_salary !== undefined) kpis.push({ label: 'Avg Salary', value: `₹${parseFloat(summary.avg_salary).toFixed(0)}`, color: 'teal' });
    if (summary.total_bonus !== undefined) kpis.push({ label: 'Total Bonus', value: `₹${parseFloat(summary.total_bonus).toFixed(0)}`, color: 'green' });
  }

  const chartData = rows.slice(0, 12).map(r => ({
    name: r.month || r.employee_name || r.name || r.period || '',
    salary: parseFloat(r.net_salary || r.salary || r.total || 0),
    bonus: parseFloat(r.bonus || 0),
  }));

  return (
    <div>
      {kpis.length > 0 && (
        <div className="kpi-grid">
          {kpis.map((k, i) => <KPICard key={i} {...k} />)}
        </div>
      )}
      {chartData.length > 0 && chartData.some(d => d.salary > 0) && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Payroll Overview</h3></div>
          <div className="chart-container" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`₹${v.toFixed(2)}`]} />
                <Legend />
                <Bar dataKey="salary" fill="#f59e0b" name="Net Salary" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bonus" fill="#10b981" name="Bonus" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {rows.length > 0 && <DataTable data={rows} title="Payroll Records" />}
    </div>
  );
}

function SuppliersSection({ data }) {
  if (!data) return null;
  const rows = Array.isArray(data) ? data : (data.suppliers || data.data || []);
  const summary = !Array.isArray(data) ? data : null;

  const kpis = [];
  if (summary) {
    if (summary.total_suppliers !== undefined) kpis.push({ label: 'Total Suppliers', value: summary.total_suppliers, color: 'purple' });
    if (summary.total_orders !== undefined) kpis.push({ label: 'Total Orders', value: summary.total_orders, color: 'blue' });
    if (summary.total_spend !== undefined) kpis.push({ label: 'Total Spend', value: `₹${parseFloat(summary.total_spend).toFixed(0)}`, color: 'teal' });
    if (summary.active_suppliers !== undefined) kpis.push({ label: 'Active Suppliers', value: summary.active_suppliers, color: 'green' });
  }

  const chartData = rows.slice(0, 8).map(r => ({
    name: (r.supplier_name || r.name || '').slice(0, 12),
    orders: parseInt(r.order_count || r.orders || 0),
    spend: parseFloat(r.total_spend || r.amount || 0),
  }));

  return (
    <div>
      {kpis.length > 0 && (
        <div className="kpi-grid">
          {kpis.map((k, i) => <KPICard key={i} {...k} />)}
        </div>
      )}
      {chartData.length > 0 && chartData.some(d => d.orders > 0 || d.spend > 0) && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Supplier Spend Distribution</h3></div>
          <div className="chart-container" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="spend" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {chartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`₹${v.toFixed(2)}`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {rows.length > 0 && <DataTable data={rows} title="Supplier Details" />}
    </div>
  );
}

const SECTIONS = [
  { key: 'revenue', label: 'Revenue', icon: '📈', color: '#14b8a6' },
  { key: 'products', label: 'Products', icon: '📦', color: '#3b82f6' },
  { key: 'inventory', label: 'Inventory', icon: '🗃', color: '#10b981' },
  { key: 'payroll', label: 'Payroll', icon: '💼', color: '#f59e0b' },
  { key: 'suppliers', label: 'Suppliers', icon: '🏭', color: '#8b5cf6' },
];

export default function AnalyticsPanel() {
  const [activeSection, setActiveSection] = useState('revenue');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const fetchSection = async (key) => {
    if (data[key] !== undefined) return;
    setLoading(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: '' }));
    try {
      let res;
      switch (key) {
        case 'revenue': res = await getRevenue(); break;
        case 'products': res = await getProductsAnalytics(); break;
        case 'inventory': res = await getInventoryAnalytics(); break;
        case 'payroll': res = await getPayrollAnalytics(); break;
        case 'suppliers': res = await getSuppliersAnalytics(); break;
        default: return;
      }
      setData(prev => ({ ...prev, [key]: res.data }));
    } catch (err) {
      setErrors(prev => ({ ...prev, [key]: err?.response?.data?.message || `Failed to load ${key} analytics.` }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleTabChange = (key) => {
    setActiveSection(key);
    fetchSection(key);
  };

  useEffect(() => {
    fetchSection('revenue');
  }, []);

  const refresh = (key) => {
    setData(prev => { const n = { ...prev }; delete n[key]; return n; });
    setTimeout(() => fetchSection(key), 50);
  };

  const renderSection = () => {
    const isLoading = loading[activeSection];
    const error = errors[activeSection];
    const sectionData = data[activeSection];
    const section = SECTIONS.find(s => s.key === activeSection);

    if (isLoading) return <div className="card"><p className="text-muted">Loading {section?.label} analytics...</p></div>;
    if (error) return <div className="alert alert-error">{error}</div>;
    if (!sectionData) return <div className="card"><p className="text-muted">Click refresh to load data.</p></div>;

    switch (activeSection) {
      case 'revenue': return <RevenueSection data={sectionData} />;
      case 'products': return <ProductsSection data={sectionData} />;
      case 'inventory': return <InventorySection data={sectionData} />;
      case 'payroll': return <PayrollSection data={sectionData} />;
      case 'suppliers': return <SuppliersSection data={sectionData} />;
      default: return null;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Analytics Dashboard</h2>
        <p className="text-muted text-sm">Business intelligence and performance metrics.</p>
      </div>

      <div className="tabs">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            className={`tab${activeSection === s.key ? ' active' : ''}`}
            onClick={() => handleTabChange(s.key)}
          >
            {s.icon} {s.label}
          </button>
        ))}
        <button
          className="btn btn-secondary btn-sm"
          style={{ marginLeft: 'auto', fontSize: '0.8rem' }}
          onClick={() => refresh(activeSection)}
          disabled={loading[activeSection]}
        >
          ↻ Refresh
        </button>
      </div>

      {renderSection()}
    </div>
  );
}
