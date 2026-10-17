import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { analyticsApi } from '../api/endpoints';
import { scenes } from '../assets/scenes';
import { PageBanner } from '../components/PageBanner';
import { useAuth } from '../context/AuthContext';

interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockCount: number;
  totalExpenses: number;
  salesData?: { label: string; value: number }[];
  categoryData?: { name: string; value: number }[];
}

const COLORS = ['#1c8f45', '#7dcea0', '#e8b86d', '#e07a5f', '#5f8f72', '#c4d7b2'];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, isAccountant } = useAuth();

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getDashboard();
      const raw = res.data as {
        monthlySales?: number;
        totalOrders?: number;
        totalProducts?: number;
        totalCustomers?: number;
        lowStockCount?: number;
        totalExpenses?: number;
        monthlySalesChart?: { name: string; value: number }[];
        categorySalesChart?: { name: string; value: number }[];
      };
      setData({
        totalRevenue: Number(raw.monthlySales ?? 0),
        totalOrders: Number(raw.totalOrders ?? 0),
        totalProducts: Number(raw.totalProducts ?? 0),
        totalCustomers: Number(raw.totalCustomers ?? 0),
        lowStockCount: Number(raw.lowStockCount ?? 0),
        totalExpenses: Number(raw.totalExpenses ?? 0),
        salesData: (raw.monthlySalesChart ?? []).map((d) => ({
          label: d.name,
          value: Number(d.value),
        })),
        categoryData: (raw.categorySalesChart ?? []).map((d) => ({
          name: d.name,
          value: Number(d.value),
        })),
      });
    } catch {
      // Use placeholder data so UI is never empty
      setData({
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalCustomers: 0,
        lowStockCount: 0,
        totalExpenses: 0,
        salesData: [],
        categoryData: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const canViewFinance = isAdmin() || isAccountant();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" />
        <p style={{ color: 'var(--text-muted)' }}>Loading dashboard…</p>
      </div>
    );
  }

  const salesChartData = data?.salesData?.map((d) => ({
    name: d.label,
    Revenue: d.value,
  })) ?? [];

  const pieData = data?.categoryData ?? [];

  return (
    <div>
      {/* Header */}
      <PageBanner image={scenes.dashboard}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="page-subtitle">Here's what's happening in your store today.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchDashboard}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
      </PageBanner>

      {/* Stats */}
      <div className="stats-grid">
        {canViewFinance && (
          <div className="stat-card primary">
            <div className="flex items-center justify-between">
              <div className="stat-icon primary">
                <DollarSign size={22} />
              </div>
              </div>
            <div>
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">{formatCurrency(data?.totalRevenue ?? 0)}</div>
            </div>
          </div>
        )}

        <div className="stat-card green">
          <div className="flex items-center justify-between">
            <div className="stat-icon green">
              <ShoppingBag size={22} />
            </div>
          </div>
          <div>
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{data?.totalOrders ?? 0}</div>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="flex items-center justify-between">
            <div className="stat-icon orange">
              <Package size={22} />
            </div>
          </div>
          <div>
            <div className="stat-label">Products</div>
            <div className="stat-value">{data?.totalProducts ?? 0}</div>
          </div>
        </div>

        {canViewFinance && (
          <div className="stat-card purple">
            <div className="flex items-center justify-between">
              <div className="stat-icon purple">
                <Users size={22} />
              </div>
            </div>
            <div>
              <div className="stat-label">Customers</div>
              <div className="stat-value">{data?.totalCustomers ?? 0}</div>
            </div>
          </div>
        )}

        {(data?.lowStockCount ?? 0) > 0 && (
          <div className="stat-card red">
            <div className="flex items-center justify-between">
              <div className="stat-icon red">
                <AlertTriangle size={22} />
              </div>
            </div>
            <div>
              <div className="stat-label" style={{ color: 'var(--accent)' }}>
                Low Stock Alerts
              </div>
              <div className="stat-value" style={{ color: 'var(--accent)' }}>
                {data?.lowStockCount}
              </div>
            </div>
          </div>
        )}

        {canViewFinance && (
          <div className="stat-card orange">
            <div className="flex items-center justify-between">
              <div className="stat-icon orange">
                <TrendingUp size={22} />
              </div>
            </div>
            <div>
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value">{formatCurrency(data?.totalExpenses ?? 0)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      {canViewFinance && (
        <div className="charts-grid">
          {/* Sales Area Chart */}
          <div className="chart-card">
            <div className="chart-title">Revenue Overview</div>
            {salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={salesChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1c8f45" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1c8f45" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-muted)"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                    formatter={(v) => [formatCurrency(Number(v ?? 0)), 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#1c8f45"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <p>No sales data yet</p>
              </div>
            )}
          </div>

          {/* Category Pie Chart */}
          <div className="chart-card">
            <div className="chart-title">Sales by Category</div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <p>No category data yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick tips */}
      <div className="card" style={{ marginTop: '1.25rem' }}>
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href="/products" className="btn btn-secondary btn-sm">
            <Package size={14} /> Browse Products
          </a>
          <a href="/orders" className="btn btn-secondary btn-sm">
            <ShoppingBag size={14} /> View Orders
          </a>
          {canViewFinance && (
            <a href="/analytics" className="btn btn-secondary btn-sm">
              <TrendingUp size={14} /> Analytics
            </a>
          )}
          {canViewFinance && (
            <a href="/expenses" className="btn btn-secondary btn-sm">
              <DollarSign size={14} /> Expenses
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
