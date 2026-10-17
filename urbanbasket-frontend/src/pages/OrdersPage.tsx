import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Search, Eye, RefreshCw, X, Ban, Undo2,
} from 'lucide-react';
import { orderApi } from '../api/endpoints';
import { scenes } from '../assets/scenes';
import { PageBanner } from '../components/PageBanner';
import { optionsFrom, Select } from '../components/Select';
import { useAuth } from '../context/AuthContext';

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  totalAmount: number;
  orderDate: string;
  items: OrderItem[];
}

const STATUS_OPTIONS = ['All', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'];

const nextStatuses = (status: string) => {
  if (status === 'PENDING') return ['PENDING', 'CONFIRMED', 'CANCELLED'];
  if (status === 'CONFIRMED') return ['CONFIRMED', 'SHIPPED', 'CANCELLED'];
  if (status === 'SHIPPED') return ['SHIPPED', 'DELIVERED'];
  return [];
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-warning',
  CONFIRMED: 'badge-info',
  PROCESSING: 'badge-info',
  SHIPPED: 'badge-yellow',
  DELIVERED: 'badge-success',
  CANCELLED: 'badge-danger',
  RETURNED: 'badge-neutral',
  REFUNDED: 'badge-info',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtered, setFiltered] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const { isAdmin, isStaff, isCustomer } = useAuth();

  const canManage = isAdmin() || isStaff();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = isCustomer()
        ? await orderApi.getMyOrders()
        : await orderApi.getAll();
      setOrders(res.data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    let result = orders;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.customerEmail?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'All') {
      result = result.filter((o) => o.status === statusFilter);
    }
    setFiltered(result);
  }, [orders, search, statusFilter]);

  const handleCancel = async (order: Order) => {
    if (!confirm(`Cancel order #${order.orderNumber}? This is only allowed before the order ships.`)) return;
    setActingId(order.id);
    try {
      await orderApi.cancel(order.id);
      fetchOrders();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          || 'This order can no longer be cancelled.'
      );
    } finally {
      setActingId(null);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await orderApi.updateStatus(orderId, newStatus);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch {
      alert('Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div>
      <PageBanner image={scenes.orders}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{orders.length} total orders</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchOrders}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      </PageBanner>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            className="form-control"
            placeholder="Search by order # or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          style={{ width: 'auto', minWidth: 160 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={optionsFrom(STATUS_OPTIONS)}
        />
        {(search || statusFilter !== 'All') && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setStatusFilter('All'); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="loading-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ClipboardList size={28} /></div>
          <h3>No orders found</h3>
          <p>Orders will appear here once placed.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                {!isCustomer() && <th>Customer</th>}
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td><strong>#{o.orderNumber || o.id}</strong></td>
                  {!isCustomer() && (
                    <td>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{o.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.customerEmail}</div>
                      </div>
                    </td>
                  )}
                  <td>{formatDate(o.orderDate)}</td>
                  <td>{o.items?.length ?? 0} items</td>
                  <td><strong style={{ color: 'var(--primary-light)' }}>{formatCurrency(o.totalAmount)}</strong></td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[o.status] ?? 'badge-neutral'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => setSelectedOrder(o)}
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      {isCustomer() && (o.status === 'PENDING' || o.status === 'CONFIRMED') && (
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={actingId === o.id}
                          onClick={() => handleCancel(o)}
                        >
                          <Ban size={14} /> Cancel
                        </button>
                      )}
                      {isCustomer() && o.status === 'DELIVERED' && (
                        <Link className="btn btn-ghost btn-sm" to={`/returns?orderId=${o.id}`}>
                          <Undo2 size={14} /> Return
                        </Link>
                      )}
                      {canManage && nextStatuses(o.status).length > 1 && (
                        <div style={{ position: 'relative' }}>
                          <Select
                            size="sm"
                            style={{ width: 'auto', minWidth: 132 }}
                            value={o.status}
                            disabled={updatingStatus}
                            onChange={(status) => handleStatusChange(o.id, status)}
                            options={optionsFrom(nextStatuses(o.status))}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedOrder(null)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">Order #{selectedOrder.orderNumber || selectedOrder.id}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedOrder(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Customer</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedOrder.customerName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedOrder.customerEmail}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Status</div>
                <span className={`badge ${STATUS_BADGE[selectedOrder.status] ?? 'badge-neutral'}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Date</div>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{formatDate(selectedOrder.orderDate)}</div>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.productName}</strong></td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td><strong>{formatCurrency(item.subtotal)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '1rem',
                padding: '0.75rem 0 0',
                borderTop: '1px solid var(--border)',
                gap: '0.5rem',
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total:</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                {formatCurrency(selectedOrder.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
