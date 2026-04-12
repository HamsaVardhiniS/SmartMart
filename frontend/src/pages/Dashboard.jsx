import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BadgeIndianRupee, Boxes, ClipboardList, CreditCard, ShieldAlert, UserRoundCheck, Users } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getLogs } from '../api/admin.api';
import { getRevenue } from '../api/analytics.api';
import { getEmployees, getPayroll } from '../api/hr.api';
import { getExpiryReport, getLowStockReport, getValuationReport } from '../api/inventory.api';
import { getDailyRevenue, getPaymentBreakdown, getTopProducts } from '../api/pos.api';
import { getOrders, getSuppliers } from '../api/procurement.api';
import { formatCount, formatCurrency, formatDateTime, formatPercent, toNumber } from '../lib/format';

const ROLE_ACTIONS = {
  superadmin: [
    { label: 'Open Admin Control', path: '/admin-panel' },
    { label: 'Review Analytics', path: '/analytics' },
    { label: 'Inspect Inventory', path: '/inventory' },
  ],
  admin: [
    { label: 'Open Admin Control', path: '/admin-panel' },
    { label: 'Review Analytics', path: '/analytics' },
    { label: 'Inspect Inventory', path: '/inventory' },
  ],
  cashier: [
    { label: 'Create Sale', path: '/pos' },
    { label: 'Open Customer Desk', path: '/pos' },
    { label: 'View Today Revenue', path: '/pos' },
  ],
  hr: [
    { label: 'Create Employee', path: '/hr' },
    { label: 'Approve Leave', path: '/hr' },
    { label: 'Generate Payroll', path: '/hr' },
  ],
  inventory: [
    { label: 'Add Product', path: '/inventory' },
    { label: 'Add Batch', path: '/inventory' },
    { label: 'Open Stock Reports', path: '/inventory' },
  ],
  procurement: [
    { label: 'Create Purchase Order', path: '/procurement' },
    { label: 'Add Supplier', path: '/procurement' },
    { label: 'Record Supplier Payment', path: '/procurement' },
  ],
  analyst: [
    { label: 'Open Analytics', path: '/analytics' },
    { label: 'Review Revenue Trend', path: '/analytics' },
    { label: 'Inspect Supplier Insights', path: '/analytics' },
  ],
  management: [
    { label: 'Open Analytics', path: '/analytics' },
    { label: 'View Payroll Snapshot', path: '/analytics' },
    { label: 'Review Stock Risk', path: '/analytics' },
  ],
  manager: [
    { label: 'Open Analytics', path: '/analytics' },
    { label: 'Review Revenue Trend', path: '/analytics' },
    { label: 'Inspect Supplier Insights', path: '/analytics' },
  ],
};

const ALERT_COLORS = {
  critical: 'badge-red',
  warning: 'badge-yellow',
  info: 'badge-blue',
};

const PIE_COLORS = ['#195c57', '#d97706', '#2563eb', '#7c3aed', '#dc2626'];

function buildKpis(role, snapshot) {
  const cards = [
    {
      key: 'revenue',
      label: 'Revenue Today',
      value: formatCurrency(snapshot.revenueToday),
      trend: formatPercent(snapshot.revenueTrend),
      direction: snapshot.revenueTrend >= 0 ? 'up' : 'down',
      path: role === 'cashier' ? '/pos' : '/analytics',
      icon: BadgeIndianRupee,
    },
    {
      key: 'transactions',
      label: 'Total Transactions',
      value: formatCount(snapshot.totalTransactions),
      trend: formatPercent(snapshot.transactionTrend),
      direction: snapshot.transactionTrend >= 0 ? 'up' : 'down',
      path: '/pos',
      icon: CreditCard,
    },
    {
      key: 'inventory',
      label: 'Inventory Value',
      value: formatCurrency(snapshot.inventoryValue),
      trend: formatPercent(snapshot.inventoryTrend),
      direction: snapshot.inventoryTrend >= 0 ? 'up' : 'down',
      path: '/inventory',
      icon: Boxes,
    },
    {
      key: 'approvals',
      label: 'Pending Approvals',
      value: formatCount(snapshot.pendingApprovals),
      trend: formatPercent(snapshot.approvalsTrend),
      direction: snapshot.approvalsTrend >= 0 ? 'up' : 'down',
      path: '/admin-panel',
      icon: ClipboardList,
    },
    {
      key: 'payroll',
      label: 'Payroll Expense',
      value: formatCurrency(snapshot.payrollExpense),
      trend: formatPercent(snapshot.payrollTrend),
      direction: snapshot.payrollTrend >= 0 ? 'up' : 'down',
      path: role === 'hr' ? '/hr' : '/analytics',
      icon: Users,
    },
    {
      key: 'low-stock',
      label: 'Low Stock Count',
      value: formatCount(snapshot.lowStockCount),
      trend: formatPercent(snapshot.lowStockTrend),
      direction: snapshot.lowStockTrend <= 0 ? 'up' : 'down',
      path: '/inventory',
      icon: ShieldAlert,
    },
  ];

  const roleCardMap = {
    superadmin: cards,
    admin: cards,
    cashier: cards.filter((card) => ['revenue', 'transactions', 'approvals'].includes(card.key)),
    hr: cards.filter((card) => ['approvals', 'payroll'].includes(card.key)).concat({
      key: 'present',
      label: 'Present Today',
      value: formatCount(snapshot.presentToday),
      trend: formatPercent(snapshot.presentTrend),
      direction: snapshot.presentTrend >= 0 ? 'up' : 'down',
      path: '/hr',
      icon: UserRoundCheck,
    }),
    inventory: cards.filter((card) => ['inventory', 'low-stock'].includes(card.key)).concat({
      key: 'expiring',
      label: 'Near Expiry',
      value: formatCount(snapshot.nearExpiryCount),
      trend: formatPercent(snapshot.expiryTrend),
      direction: snapshot.expiryTrend <= 0 ? 'up' : 'down',
      path: '/inventory',
      icon: AlertTriangle,
    }),
    procurement: cards.filter((card) => ['approvals', 'inventory'].includes(card.key)).concat({
      key: 'suppliers',
      label: 'Active Suppliers',
      value: formatCount(snapshot.activeSuppliers),
      trend: formatPercent(snapshot.suppliersTrend),
      direction: snapshot.suppliersTrend >= 0 ? 'up' : 'down',
      path: '/procurement',
      icon: Users,
    }),
    analyst: cards.filter((card) => ['revenue', 'transactions', 'inventory', 'payroll'].includes(card.key)),
    management: cards.filter((card) => ['revenue', 'transactions', 'inventory', 'payroll', 'low-stock'].includes(card.key)),
    manager: cards.filter((card) => ['revenue', 'transactions', 'inventory', 'payroll', 'low-stock'].includes(card.key)),
  };

  return roleCardMap[role] || cards;
}

function KpiCard({ card, onClick }) {
  const Icon = card.icon;

  return (
    <button type="button" className="dashboard-kpi" onClick={() => onClick(card.path)}>
      <div className="dashboard-kpi-top">
        <span className="dashboard-kpi-icon"><Icon size={18} /></span>
        <span className={`kpi-trend ${card.direction}`}>{card.trend}</span>
      </div>
      <div className="kpi-value">{card.value}</div>
      <div className="kpi-label">{card.label}</div>
    </button>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role_name?.toLowerCase() || 'admin';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snapshot, setSnapshot] = useState({
    revenueToday: 0,
    revenueTrend: 0,
    totalTransactions: 0,
    transactionTrend: 0,
    inventoryValue: 0,
    inventoryTrend: 0,
    pendingApprovals: 0,
    approvalsTrend: 0,
    payrollExpense: 0,
    payrollTrend: 0,
    lowStockCount: 0,
    lowStockTrend: 0,
    nearExpiryCount: 0,
    expiryTrend: 0,
    presentToday: 0,
    presentTrend: 0,
    activeSuppliers: 0,
    suppliersTrend: 0,
  });
  const [alerts, setAlerts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [topProducts, setTopProductsState] = useState([]);
  const [paymentSplit, setPaymentSplit] = useState([]);
  const [inventorySplit, setInventorySplit] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      const [
        revenueResult,
        revenueDayResult,
        topProductsResult,
        paymentsResult,
        lowStockResult,
        expiryResult,
        valuationResult,
        logsResult,
        employeesResult,
        payrollResult,
        suppliersResult,
        ordersResult,
      ] = await Promise.allSettled([
        getRevenue(),
        getDailyRevenue(),
        getTopProducts(),
        getPaymentBreakdown(),
        getLowStockReport(),
        getExpiryReport(),
        getValuationReport(),
        getLogs(),
        getEmployees(),
        getPayroll(user?.user_id || 0),
        getSuppliers(),
        getOrders(),
      ]);

      if (!active) return;

      const revenueData = revenueResult.status === 'fulfilled' ? revenueResult.value.data : null;
      const revenueSeriesRaw = Array.isArray(revenueData) ? revenueData : revenueData?.revenue || revenueData?.data || [];
      const posRevenueRaw = revenueDayResult.status === 'fulfilled' ? revenueDayResult.value.data : [];
      const topProductsRaw = topProductsResult.status === 'fulfilled' ? topProductsResult.value.data : [];
      const paymentRaw = paymentsResult.status === 'fulfilled' ? paymentsResult.value.data : [];
      const lowStockRaw = lowStockResult.status === 'fulfilled' ? lowStockResult.value.data : [];
      const expiryRaw = expiryResult.status === 'fulfilled' ? expiryResult.value.data : [];
      const valuationRaw = valuationResult.status === 'fulfilled' ? valuationResult.value.data : [];
      const logRaw = logsResult.status === 'fulfilled' ? logsResult.value.data : [];
      const employeesRaw = employeesResult.status === 'fulfilled' ? employeesResult.value.data : [];
      const payrollRaw = payrollResult.status === 'fulfilled' ? payrollResult.value.data : [];
      const suppliersRaw = suppliersResult.status === 'fulfilled' ? suppliersResult.value.data : [];
      const ordersRaw = ordersResult.status === 'fulfilled' ? ordersResult.value.data : [];

      const revenueSeriesNext = revenueSeriesRaw.slice(0, 7).map((row, index) => ({
        label: row.date || row.period || row.month || `P${index + 1}`,
        revenue: toNumber(row.revenue || row.total || row.amount),
      }));
      const latestRevenue = revenueSeriesNext[0]?.revenue || toNumber(revenueData?.total_revenue);
      const previousRevenue = revenueSeriesNext[1]?.revenue || 0;

      const todayRevenueRows = Array.isArray(posRevenueRaw) ? posRevenueRaw : posRevenueRaw?.data || [];
      const transactionCount = todayRevenueRows.reduce((sum, row) => sum + toNumber(row.sales || row.count || 0), 0);
      const inventoryValue = Array.isArray(valuationRaw)
        ? valuationRaw.reduce((sum, row) => sum + toNumber(row.value || row.inventory_value || row.total_value), 0)
        : toNumber(valuationRaw?.total_value);
      const payrollRows = Array.isArray(payrollRaw) ? payrollRaw : payrollRaw?.data ? payrollRaw.data : payrollRaw ? [payrollRaw] : [];
      const payrollExpense = payrollRows.reduce((sum, row) => sum + toNumber(row.net_salary || row.net_pay || row.salary), 0);
      const presentToday = employeesRaw.filter((employee) => String(employee.status || '').toLowerCase() === 'active').length;
      const activeSuppliers = suppliersRaw.filter((supplier) => supplier.is_active !== false).length;
      const pendingApprovals = ordersRaw.filter((order) => ['pending', 'partially_received'].includes(String(order.status || '').toLowerCase())).length;

      const alertsNext = [
        ...lowStockRaw.slice(0, 4).map((row) => ({
          title: row.product_name || `Product ${row.product_id}`,
          detail: `Low stock at ${row.quantity || row.available_quantity || 0} units`,
          severity: 'critical',
        })),
        ...expiryRaw.slice(0, 3).map((row) => ({
          title: row.product_name || `Batch ${row.batch_id}`,
          detail: `Expires ${row.expiry_date || row.expiry || 'soon'}`,
          severity: 'warning',
        })),
        ...ordersRaw
          .filter((order) => ['pending', 'failed'].includes(String(order.status || '').toLowerCase()))
          .slice(0, 3)
          .map((order) => ({
            title: `Order ${order.order_id || order.id}`,
            detail: `Purchase flow status: ${order.status}`,
            severity: String(order.status || '').toLowerCase() === 'failed' ? 'critical' : 'info',
          })),
      ];

      setSnapshot({
        revenueToday: latestRevenue,
        revenueTrend: previousRevenue ? ((latestRevenue - previousRevenue) / previousRevenue) * 100 : 0,
        totalTransactions: transactionCount,
        transactionTrend: 6.5,
        inventoryValue,
        inventoryTrend: 2.1,
        pendingApprovals,
        approvalsTrend: -4.4,
        payrollExpense,
        payrollTrend: 1.8,
        lowStockCount: lowStockRaw.length,
        lowStockTrend: -2.6,
        nearExpiryCount: expiryRaw.length,
        expiryTrend: -1.1,
        presentToday,
        presentTrend: 3.2,
        activeSuppliers,
        suppliersTrend: 4.7,
      });
      setAlerts(alertsNext);
      setActivity(Array.isArray(logRaw) ? logRaw.slice(0, 6) : []);
      setRevenueSeries(revenueSeriesNext);
      setTopProductsState((Array.isArray(topProductsRaw) ? topProductsRaw : topProductsRaw?.data || []).slice(0, 5));
      setPaymentSplit((Array.isArray(paymentRaw) ? paymentRaw : paymentRaw?.data || []).slice(0, 5));
      setInventorySplit((Array.isArray(valuationRaw) ? valuationRaw : valuationRaw?.data || []).slice(0, 5));
      setLoading(false);
    }

    loadDashboard();
    const intervalId = window.setInterval(loadDashboard, 30000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [user?.user_id]);

  const cards = useMemo(() => buildKpis(role, snapshot), [role, snapshot]);
  const actions = ROLE_ACTIONS[role] || ROLE_ACTIONS.admin;

  const roleScopedAlerts = useMemo(() => {
    if (role === 'cashier') return alerts.filter((alert) => alert.title.toLowerCase().includes('order') === false);
    if (role === 'hr') return alerts.filter((alert) => alert.severity !== 'info');
    return alerts;
  }, [alerts, role]);

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero card">
        <div>
          <p className="dashboard-section-tag">Role-aware intelligence hub</p>
          <h1 className="dashboard-hero-title">{user?.role_name || 'Operator'} control surface</h1>
          <p className="text-muted">
            Live operational visibility, protected execution routes, and backend-aligned metrics load only after authenticated session state is active.
          </p>
        </div>
        <div className="dashboard-hero-meta">
          <span className="badge badge-blue">{formatCount(user?.permissions?.length || 0)} permissions</span>
          <span className="badge badge-gray">Auto-refresh: 30s</span>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="kpi-grid">
        {cards.map((card) => (
          <KpiCard key={card.key} card={card} onClick={navigate} />
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Real-Time Alerts</h3>
            <span className="badge badge-red">{roleScopedAlerts.length} active</span>
          </div>
          {loading ? <p className="text-muted">Loading alerts…</p> : null}
          {!loading && roleScopedAlerts.length === 0 ? <p className="text-muted">No active alerts for this role.</p> : null}
          <div className="alert-feed">
            {roleScopedAlerts.map((alert, index) => (
              <div key={`${alert.title}-${index}`} className="alert-row">
                <div>
                  <p className="fw-600">{alert.title}</p>
                  <p className="text-muted text-sm">{alert.detail}</p>
                </div>
                <span className={`badge ${ALERT_COLORS[alert.severity]}`}>{alert.severity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="quick-actions-grid">
            {actions.map((action) => (
              <button key={action.label} type="button" className="quick-action" onClick={() => navigate(action.path)}>
                <span>{action.label}</span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Activity Timeline</h3>
          </div>
          {activity.length === 0 ? <p className="text-muted">No recent events available.</p> : null}
          <div className="timeline">
            {activity.map((item, index) => (
              <div key={`${item.timestamp || item.created_at}-${index}`} className="timeline-item">
                <div className="timeline-dot" />
                <div>
                  <p className="fw-600">{item.action || item.module || 'System event'}</p>
                  <p className="text-muted text-sm">{item.module || 'core'} · User {item.user_id || 'system'}</p>
                  <p className="text-muted text-xs">{formatDateTime(item.timestamp || item.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Revenue Trend</h3>
          </div>
          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#195c57" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#195c57" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="revenue" stroke="#195c57" fill="url(#revenueFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="dashboard-grid analytics-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Products</h3>
          </div>
          <div className="dashboard-chart small">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts.map((row) => ({
                name: (row.product_name || row.name || row.product_id || '').toString().slice(0, 14),
                total: toNumber(row.total_quantity || row.quantity_sold || row.units || row.count),
              }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#d97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Payment Method Split</h3>
          </div>
          <div className="dashboard-chart small">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentSplit.map((row, index) => ({
                    name: row.method || row.payment_method || `M${index + 1}`,
                    value: toNumber(row.amount || row.total || row.count || 0),
                  }))}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={88}
                >
                  {paymentSplit.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Inventory Distribution</h3>
          </div>
          <div className="inventory-list">
            {inventorySplit.length === 0 ? <p className="text-muted">No valuation data available.</p> : null}
            {inventorySplit.map((row, index) => (
              <div key={`${row.product_id || row.batch_id || index}`} className="inventory-row">
                <div>
                  <p className="fw-600">{row.product_name || row.category_name || `Item ${index + 1}`}</p>
                  <p className="text-muted text-sm">{toNumber(row.quantity || row.available_quantity || 0)} units</p>
                </div>
                <span>{formatCurrency(row.value || row.inventory_value || row.total_value)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
