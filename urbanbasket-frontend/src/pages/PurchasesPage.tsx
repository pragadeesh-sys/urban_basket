import { useEffect, useState, type FormEvent } from 'react';
import { ShoppingBag, Plus, Eye, X, CheckCircle, Clock, Truck } from 'lucide-react';
import { productApi, purchaseApi, supplierApi } from '../api/endpoints';
import { scenes } from '../assets/scenes';
import { PageBanner } from '../components/PageBanner';
import { Select } from '../components/Select';
import { useAuth } from '../context/AuthContext';

interface PurchaseItem {
  id: number;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

interface Purchase {
  id: number;
  purchaseNumber?: string;
  supplierName: string;
  purchaseDate: string;
  status: string;
  totalAmount: number;
  items: PurchaseItem[];
}

interface CatalogProduct {
  id: number;
  name: string;
  sku: string;
  purchasePrice: number;
  stockQuantity: number;
  minimumStockLevel: number;
  lowStock: boolean;
}

interface Supplier {
  id: number;
  name: string;
  hasLogin?: boolean;
}

const STATUS_BADGE: Record<string, string> = {
  REQUESTED: 'badge-warning',
  DELIVERED: 'badge-success',
  RECEIVED: 'badge-success',
  ORDERED: 'badge-warning',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export function PurchasesPage() {
  const { isSupplier, isAdmin, isStaff } = useAuth();
  const canRequest = isAdmin() || isStaff();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [formError, setFormError] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: '1', unitCost: '' }]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveringId, setDeliveringId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isSupplier()) {
        const pRes = await purchaseApi.getMine();
        setPurchases(pRes.data);
      } else {
        const [pRes, sRes, prodRes] = await Promise.all([
          purchaseApi.getAll(),
          supplierApi.getAll(),
          productApi.getAll(),
        ]);
        setPurchases(pRes.data);
        setSuppliers(sRes.data);
        setCatalog(prodRes.data);
      }
    } catch { setPurchases([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    const payload = {
      supplierId: parseInt(supplierId),
      notes,
      items: items.map((i) => ({
        productId: parseInt(i.productId),
        quantity: parseInt(i.quantity),
        unitCost: parseFloat(i.unitCost),
      })),
    };
    try {
      await purchaseApi.create(payload);
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create purchase.'
      );
    }
  };

  const addItem = () => setItems([...items, { productId: '', quantity: '1', unitCost: '' }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, key: string, val: string) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, [key]: val } : it)));

  const deliver = async () => {
    if (deliveringId == null) return;
    try {
      await purchaseApi.deliver(deliveringId);
      setDeliveringId(null);
      fetchData();
    } catch (err: unknown) {
      setDeliveringId(null);
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not deliver this request.');
    }
  };

  const requestProduct = (product: CatalogProduct) => {
    setSupplierId('');
    setNotes(`Restock ${product.name}`);
    setItems([{ productId: String(product.id), quantity: '1', unitCost: String(product.purchasePrice ?? '') }]);
    setFormError('');
    setShowModal(true);
  };

  const lowStock = catalog.filter((product) => product.lowStock);
  const linkedSuppliers = suppliers.filter((supplier) => supplier.hasLogin);
  const totalValue = purchases
    .filter((purchase) => !purchase.status || purchase.status === 'DELIVERED' || purchase.status === 'RECEIVED')
    .reduce((acc, purchase) => acc + Number(purchase.totalAmount || 0), 0);

  return (
    <div>
      <PageBanner image={scenes.purchases}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isSupplier() ? 'Purchase requests' : 'Purchases'}</h1>
          <p className="page-subtitle">
            {isSupplier()
              ? 'Deliver requests to add the stock.'
              : 'Request stock from a supplier when a product is low.'}
          </p>
        </div>
        {canRequest && (
          <button className="btn btn-primary" onClick={() => { setSupplierId(''); setNotes(''); setItems([{ productId: '', quantity: '1', unitCost: '' }]); setFormError(''); setShowModal(true); }}>
            <Plus size={16} /> Request stock
          </button>
        )}
      </div>
      </PageBanner>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card primary">
          <div className="stat-icon primary"><ShoppingBag size={22} /></div>
          <div><div className="stat-label">Total Purchases</div><div className="stat-value">{purchases.length}</div></div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><CheckCircle size={22} /></div>
          <div><div className="stat-label">Delivered</div><div className="stat-value">{purchases.filter((p) => p.status === 'DELIVERED' || p.status === 'RECEIVED').length}</div></div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange"><Clock size={22} /></div>
          <div><div className="stat-label">Requested</div><div className="stat-value">{purchases.filter((p) => p.status === 'REQUESTED').length}</div></div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple"><ShoppingBag size={22} /></div>
          <div><div className="stat-label">Total Value</div><div className="stat-value" style={{ fontSize: '1.3rem' }}>{formatCurrency(totalValue)}</div></div>
        </div>
      </div>

      {canRequest && lowStock.length > 0 && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-header">
            <h3 className="card-title">Low stock</h3>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {lowStock.map((product) => (
              <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{product.name}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {product.stockQuantity} in stock · minimum {product.minimumStockLevel}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => requestProduct(product)}>
                  <Truck size={14} /> Request
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-overlay"><div className="loading-spinner" /></div>
      ) : purchases.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ShoppingBag size={28} /></div>
          <h3>No purchases yet</h3>
          <p>{isSupplier() ? 'Requests from the store will show up here.' : 'Request stock when a product falls to its minimum level.'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.purchaseNumber || `#${p.id}`}</strong></td>
                  <td>{p.supplierName}</td>
                  <td>{formatDate(p.purchaseDate)}</td>
                  <td>{p.items?.length ?? 0} items</td>
                  <td><strong style={{ color: 'var(--accent-orange)' }}>{formatCurrency(p.totalAmount)}</strong></td>
                  <td><span className={`badge ${STATUS_BADGE[p.status] ?? 'badge-neutral'}`}>{p.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedPurchase(p)} title="View"><Eye size={14} /></button>
                      {isSupplier() && p.status === 'REQUESTED' && (
                        <button className="btn btn-primary btn-sm" onClick={() => setDeliveringId(p.id)}>
                          <Truck size={14} /> Deliver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Purchase Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h3 className="modal-title">Request stock</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            {formError && <div className="alert alert-error mb-2">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Supplier *</label>
                  <Select
                    required
                    placeholder="Select supplier…"
                    value={supplierId}
                    onChange={setSupplierId}
                    options={[
                      { value: '', label: 'Select supplier…' },
                      ...linkedSuppliers.map((supplier) => ({ value: String(supplier.id), label: supplier.name })),
                    ]}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
                </div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Items *</label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}><Plus size={13} /> Add Row</button>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 36px', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <Select
                      required
                      placeholder="Select product…"
                      value={item.productId}
                      onChange={(productId) => {
                        const product = lowStock.find((row) => String(row.id) === productId);
                        setItems(items.map((row, i) => i === idx
                          ? { ...row, productId, unitCost: row.unitCost || String(product?.purchasePrice ?? '') }
                          : row));
                      }}
                      options={[
                        { value: '', label: 'Select a low-stock product…' },
                        ...lowStock.map((product) => ({ value: String(product.id), label: `${product.name} · ${product.stockQuantity} left` })),
                      ]}
                    />
                    <input className="form-control" type="number" min="1" placeholder="Qty" required value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                    <input className="form-control" type="number" step="0.01" min="0" placeholder="Unit cost" required value={item.unitCost}
                      onChange={(e) => updateItem(idx, 'unitCost', e.target.value)} />
                    {items.length > 1 && (
                      <button type="button" className="btn btn-danger btn-icon btn-sm" onClick={() => removeItem(idx)}><X size={13} /></button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPurchase && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedPurchase(null)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 className="modal-title">Purchase #{selectedPurchase.id}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedPurchase(null)}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Supplier</div><div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedPurchase.supplierName}</div></div>
              <div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Date</div><div style={{ fontWeight: 500 }}>{formatDate(selectedPurchase.purchaseDate)}</div></div>
              <div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Status</div><span className={`badge ${STATUS_BADGE[selectedPurchase.status]}`}>{selectedPurchase.status}</span></div>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr></thead>
                <tbody>
                  {selectedPurchase.items?.map((it) => (
                    <tr key={it.id}><td><strong>{it.productName}</strong></td><td>{it.quantity}</td><td>{formatCurrency(it.unitCost)}</td><td><strong>{formatCurrency(it.subtotal)}</strong></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-orange)' }}>
                Total: {formatCurrency(selectedPurchase.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {deliveringId != null && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeliveringId(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">Deliver stock</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeliveringId(null)}><X size={16} /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: 0 }}>
              Deliver this request and add the items to stock.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setDeliveringId(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={deliver}>
                <Truck size={14} /> Deliver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
