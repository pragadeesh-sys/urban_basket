import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, IndianRupee, Undo2, X } from 'lucide-react';
import { orderApi, returnApi } from '../api/endpoints';
import { scenes } from '../assets/scenes';
import { PageBanner } from '../components/PageBanner';
import { Select } from '../components/Select';
import { useAuth } from '../context/AuthContext';

interface OrderRow {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  orderDate: string;
}

interface ReturnRow {
  id: number;
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  reason: string;
  status: string;
  requestedAt: string;
  resolvedAt?: string;
  refundedAt?: string;
}

const STATUS_BADGE: Record<string, string> = {
  REQUESTED: 'badge-warning',
  APPROVED: 'badge-success',
  REJECTED: 'badge-danger',
  REFUNDED: 'badge-info',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

const formatDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function ReturnsPage() {
  const { isCustomer, isAdmin, isStaff } = useAuth();
  const canReview = isAdmin() || isStaff();
  const [params, setParams] = useSearchParams();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [orderId, setOrderId] = useState(params.get('orderId') ?? '');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      if (isCustomer()) {
        const [orderRes, returnRes] = await Promise.all([
          orderApi.getMyOrders(),
          returnApi.getMine(),
        ]);
        setOrders(orderRes.data as OrderRow[]);
        setReturns(returnRes.data as ReturnRow[]);
      } else {
        const returnRes = await returnApi.getAll();
        setReturns(returnRes.data as ReturnRow[]);
      }
    } catch {
      setReturns([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const blockedOrderIds = useMemo(
    () => new Set(returns.filter((row) => row.status !== 'REJECTED').map((row) => row.orderId)),
    [returns]
  );

  const eligible = orders.filter((order) => order.status === 'DELIVERED' && !blockedOrderIds.has(order.id));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!orderId) {
      setError('Choose a delivered order.');
      return;
    }
    setSubmitting(true);
    try {
      await returnApi.create(Number(orderId), reason.trim());
      setReason('');
      setOrderId('');
      setParams({});
      setNotice('Return request sent. The store will review it.');
      await load();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          || 'Could not submit this return.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const review = async (id: number, decision: 'approve' | 'reject' | 'refund') => {
    setError('');
    try {
      if (decision === 'approve') await returnApi.approve(id);
      else if (decision === 'refund') await returnApi.refund(id);
      else await returnApi.reject(id);
      await load();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          || 'Could not update this return.'
      );
    }
  };

  return (
    <div>
      <PageBanner image={scenes.returns}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Returns</h1>
          <p className="page-subtitle">
            {isCustomer()
              ? 'Request a return after your order has been delivered.'
              : 'Review customer return requests.'}
          </p>
        </div>
      </div>
      </PageBanner>

      {error && <div className="alert alert-error mb-2"><X size={16} />{error}</div>}
      {notice && <div className="alert alert-success mb-2"><Check size={16} />{notice}</div>}

      {isCustomer() && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-header">
            <h3 className="card-title"><Undo2 size={18} /> Request a return</h3>
          </div>
          {eligible.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              You can return an order only after it is delivered, and only once.
            </p>
          ) : (
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Delivered order</label>
                <Select
                  required
                  value={orderId}
                  onChange={setOrderId}
                  placeholder="Select an order…"
                  options={[
                    { value: '', label: 'Select an order…' },
                    ...eligible.map((order) => ({
                      value: String(order.id),
                      label: `#${order.orderNumber} · ${formatCurrency(order.totalAmount)} · ${formatDate(order.orderDate)}`,
                    })),
                  ]}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea
                  className="form-control"
                  required
                  maxLength={500}
                  rows={3}
                  placeholder="What should we take back, and why?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Sending…' : 'Submit return'}
              </button>
            </form>
          )}
        </div>
      )}

      {loading ? (
        <div className="loading-overlay"><div className="loading-spinner" /></div>
      ) : returns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Undo2 size={28} /></div>
          <h3>No returns yet</h3>
          <p>{isCustomer() ? 'Delivered orders can be returned from here.' : 'Customer return requests will show up here.'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                {!isCustomer() && <th>Customer</th>}
                <th>Reason</th>
                <th>Amount</th>
                <th>Requested</th>
                <th>Status</th>
                {canReview && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {returns.map((row) => (
                <tr key={row.id}>
                  <td style={{ whiteSpace: 'nowrap' }}><strong>#{row.orderNumber}</strong></td>
                  {!isCustomer() && (
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.customerEmail}</div>
                    </td>
                  )}
                  <td style={{ minWidth: 220, maxWidth: 360 }}>{row.reason}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatCurrency(Number(row.totalAmount))}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(row.requestedAt)}</td>
                  <td><span className={`badge ${STATUS_BADGE[row.status] ?? 'badge-neutral'}`}>{row.status}</span></td>
                  {canReview && (
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {row.status === 'REQUESTED' ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => review(row.id, 'approve')}>
                            <Check size={14} /> Approve
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => review(row.id, 'reject')}>
                            <X size={14} /> Reject
                          </button>
                        </div>
                      ) : row.status === 'APPROVED' ? (
                        <button className="btn btn-primary btn-sm" onClick={() => review(row.id, 'refund')}>
                          <IndianRupee size={14} /> Refund
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {formatDate(row.status === 'REFUNDED' ? row.refundedAt : row.resolvedAt)}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
