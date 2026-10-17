import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { analyticsApi } from '../api/endpoints';
import { scenes } from '../assets/scenes';
import { PageBanner } from '../components/PageBanner';
import { Select } from '../components/Select';

interface FinancialReport {
  revenue: number;
  expenses: number;
  profit: number;
  month: number;
  year: number;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function AnalyticsPage() {
  const [salesData, setSalesData] = useState<{ name: string; Revenue: number }[]>([]);
  const [financial, setFinancial] = useState<FinancialReport | null>(null);
  const [topProducts, setTopProducts] = useState<{ name: string; unitsSold: number; revenue: number }[]>([]);
  const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [salesRes, finRes, topRes] = await Promise.allSettled([
        analyticsApi.getSalesChart(period),
        analyticsApi.getFinancialReport(month, year),
        analyticsApi.getTopProducts(),
      ]);

      if (salesRes.status === 'fulfilled') {
        setSalesData(
          (salesRes.value.data as { name: string; value: number }[]).map((d) => ({
            name: d.name,
            Revenue: Number(d.value),
          }))
        );
      }
      if (finRes.status === 'fulfilled') {
        const report = finRes.value.data as {
          totalRevenue?: number;
          totalExpenses?: number;
          netProfit?: number;
        };
        setFinancial({
          revenue: Number(report.totalRevenue ?? 0),
          expenses: Number(report.totalExpenses ?? 0),
          profit: Number(report.netProfit ?? 0),
          month,
          year,
        });
      }
      if (topRes.status === 'fulfilled') {
        setTopProducts(
          (topRes.value.data as { name: string; unitsSold: number; revenue: number }[]).map((p) => ({
            name: p.name,
            unitsSold: Number(p.unitsSold),
            revenue: Number(p.revenue),
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [period, month, year]);

  const profit = financial?.profit ?? 0;
  const isProfit = profit >= 0;

  return (
    <div>
      <PageBanner image={scenes.analytics}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Business performance insights</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchAll}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      </PageBanner>

      {/* Financial Report Controls */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Financial Report</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Select
              style={{ width: 120 }}
              value={String(month)}
              onChange={(next) => setMonth(parseInt(next, 10))}
              options={MONTHS.map((label, index) => ({ value: String(index + 1), label }))}
            />
            <Select
              style={{ width: 100 }}
              value={String(year)}
              onChange={(next) => setYear(parseInt(next, 10))}
              options={[2023, 2024, 2025, 2026].map((y) => ({ value: String(y), label: String(y) }))}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-overlay" style={{ padding: '1.5rem' }}><div className="loading-spinner" /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Revenue</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary)' }}>
                {formatCurrency(financial?.revenue ?? 0)}
              </div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Expenses</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>
                {formatCurrency(financial?.expenses ?? 0)}
              </div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Net Profit</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: isProfit ? 'var(--secondary)' : 'var(--accent)' }}>
                  {formatCurrency(Math.abs(profit))}
                </div>
                {isProfit ? <ArrowUpRight color="var(--secondary)" size={18} /> : <ArrowDownRight color="var(--accent)" size={18} />}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sales Chart */}
      <div className="chart-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="chart-title">Sales Trend</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((p) => (
              <button
                key={p}
                className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        {salesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1c8f45" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1c8f45" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v) => [formatCurrency(Number(v ?? 0)), 'Revenue']}
              />
              <Area type="monotone" dataKey="Revenue" stroke="#1c8f45" strokeWidth={2} fill="url(#grad1)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state" style={{ padding: '2rem' }}><p>No sales data for this period</p></div>
        )}
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="chart-card">
          <div className="chart-title" style={{ marginBottom: '1rem' }}>Top Selling Products</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} width={120} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v) => [formatCurrency(Number(v ?? 0)), 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#00d9a6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
