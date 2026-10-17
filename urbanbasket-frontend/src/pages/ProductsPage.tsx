import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  X,
  Filter,
  Check,
} from 'lucide-react';
import { cartApi, productApi } from '../api/endpoints';
import { scenes } from '../assets/scenes';
import { PageBanner } from '../components/PageBanner';
import { ShopHome } from '../components/ShopHome';
import { optionsFrom, Select } from '../components/Select';
import { useAuth } from '../context/AuthContext';

interface Product {
  id: number;
  name: string;
  description: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  category: string;
  sku: string;
  imageUrl?: string;
  minimumStockLevel: number;
  active: boolean;
}

const CATEGORIES = [
  'All', 'Fruits & Vegetables', 'Dairy & Bakery', 'Beverages & Snacks',
  'Staples & Household', 'Meat & Seafood', 'Frozen Foods', 'Personal Care', 'Other',
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const [localSearch, setLocalSearch] = useState('');
  const [localCategory, setLocalCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addedId, setAddedId] = useState<number | null>(null);
  const { isAdmin, isStaff, isCustomer } = useAuth();

  const canManage = isAdmin() || isStaff();
  const showActions = canManage || isCustomer();
  const customer = isCustomer();
  const search = customer ? (params.get('q') ?? '') : localSearch;
  const category = customer ? (params.get('cat') ?? 'All') : localCategory;

  const setSearch = (value: string) => {
    if (!customer) {
      setLocalSearch(value);
      return;
    }
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next, { replace: true });
  };

  const setCategory = (value: string) => {
    if (!customer) {
      setLocalCategory(value);
      return;
    }
    const next = new URLSearchParams(params);
    if (value && value !== 'All') next.set('cat', value);
    else next.delete('cat');
    setParams(next, { replace: true });
  };

  const emptyForm = {
    name: '',
    description: '',
    purchasePrice: '',
    sellingPrice: '',
    stockQuantity: '',
    category: 'Fruits & Vegetables',
    sku: '',
    minimumStockLevel: '10',
    active: true,
    imageUrl: '',
  };
  const [form, setForm] = useState<Record<string, unknown>>(emptyForm);

  const fetchProducts = async () => {
    try {
      const res = await productApi.getAll();
      setProducts(res.data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let result = products;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    if (category !== 'All') {
      result = result.filter((p) => p.category === category);
    }
    if (customer) {
      result = result.filter((p) => p.active !== false);
    }
    setFiltered(result);
  }, [products, search, category, customer]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      purchasePrice: String(p.purchasePrice),
      sellingPrice: String(p.sellingPrice),
      stockQuantity: String(p.stockQuantity),
      category: p.category,
      sku: p.sku || '',
      minimumStockLevel: String(p.minimumStockLevel),
      active: p.active,
      imageUrl: p.imageUrl || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      purchasePrice: parseFloat(form.purchasePrice as string),
      sellingPrice: parseFloat(form.sellingPrice as string),
      stockQuantity: parseInt(form.stockQuantity as string),
      minimumStockLevel: parseInt(form.minimumStockLevel as string),
    };
    try {
      if (editing) {
        await productApi.update(editing.id, payload);
      } else {
        await productApi.create(payload);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to save product.'
      );
    }
  };

  const handleAddToCart = async (productId: number) => {
    setAddingId(productId);
    try {
      await cartApi.addItem(productId, 1);
      setAddedId(productId);
      window.dispatchEvent(new Event('cart-changed'));
      window.setTimeout(() => {
        setAddedId((current) => (current === productId ? null : current));
      }, 1400);
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          || 'Failed to add this product to your cart.'
      );
    } finally {
      setAddingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productApi.delete(id);
      fetchProducts();
    } catch {
      alert('Failed to delete product.');
    }
  };

  const getStockBadge = (p: Product) => {
    if (p.stockQuantity === 0) return <span className="badge badge-danger">Out of Stock</span>;
    if (p.stockQuantity <= p.minimumStockLevel)
      return <span className="badge badge-warning">Low Stock</span>;
    return <span className="badge badge-success">In Stock</span>;
  };

  if (customer) {
    return (
      <ShopHome
        products={filtered}
        loading={loading}
        category={category}
        onCategory={setCategory}
        onAdd={handleAddToCart}
        addingId={addingId}
        addedId={addedId}
      />
    );
  }

  return (
    <div>
      <PageBanner image={scenes.products}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">
            {isCustomer()
              ? 'Add items to your cart'
              : `${products.length} products in inventory`}
          </p>
        </div>
        {canManage && (
          <button id="add-product-btn" className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>
      </PageBanner>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            className="form-control"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <Select
            style={{ width: 'auto', minWidth: 180 }}
            value={category}
            onChange={setCategory}
            options={optionsFrom(CATEGORIES)}
          />
        </div>
        {(search || category !== 'All') && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setSearch(''); setCategory('All'); }}
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={28} /></div>
          <h3>No products found</h3>
          <p>Try adjusting your search or add new products.</p>
          {canManage && (
            <button className="btn btn-primary btn-sm" onClick={openCreate}>
              <Plus size={14} /> Add Product
            </button>
          )}
        </div>
      ) : isCustomer() ? (
        <div className="catalog-grid">
          {filtered.map((p) => {
            const out = p.stockQuantity === 0;
            const added = addedId === p.id;
            return (
              <article key={p.id} className="catalog-card">
                <div className="catalog-card-top">
                  <div className="catalog-icon"><Package size={18} /></div>
                  <div className="catalog-copy">
                    <div className="catalog-name">{p.name}</div>
                    <div className="catalog-category">{p.category}</div>
                  </div>
                </div>
                <div className="catalog-foot">
                  <div>
                    <div className="catalog-price">{formatCurrency(p.sellingPrice)}</div>
                    <div style={{ marginTop: 6 }}>{getStockBadge(p)}</div>
                  </div>
                  <button
                    type="button"
                    className={`catalog-add${added ? ' added' : ''}`}
                    disabled={out || addingId === p.id}
                    title={out ? 'Out of stock' : 'Add to cart'}
                    onClick={() => handleAddToCart(p.id)}
                  >
                    {added ? <Check size={16} /> : <Plus size={16} />}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                {showActions && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: 'var(--bg-elevated)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          flexShrink: 0,
                        }}
                      >
                        <Package size={16} />
                      </div>
                      <div>
                        <strong>{p.name}</strong>
                        {p.stockQuantity <= p.minimumStockLevel && p.stockQuantity > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <AlertTriangle size={11} color="var(--accent-orange)" />
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-orange)' }}>
                              Low stock
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td><code style={{ fontSize: '0.75rem', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>{p.sku || '—'}</code></td>
                  <td><span className="badge badge-info">{p.category}</span></td>
                  <td><strong style={{ color: 'var(--primary-light)' }}>{formatCurrency(p.sellingPrice)}</strong></td>
                  <td>{p.stockQuantity}</td>
                  <td>{getStockBadge(p)}</td>
                  {showActions && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {canManage && (
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(p)} title="Edit">
                            <Edit size={14} />
                          </button>
                        )}
                        {isAdmin() && (
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(p.id)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            {error && <div className="alert alert-error mb-2"><X size={14} />{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-control" required value={form.name as string}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU *</label>
                  <input className="form-control" required value={form.sku as string}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-control" value={form.description as string}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Purchase price (₹) *</label>
                  <input className="form-control" type="number" step="0.01" min="0.01" required
                    value={form.purchasePrice as string}
                    onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Selling price (₹) *</label>
                  <input className="form-control" type="number" step="0.01" min="0.01" required
                    value={form.sellingPrice as string}
                    onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Stock Qty *</label>
                  <input className="form-control" type="number" min="0" required
                    value={form.stockQuantity as string}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Low Stock Alert *</label>
                  <input className="form-control" type="number" min="0" required
                    value={form.minimumStockLevel as string}
                    onChange={(e) => setForm({ ...form, minimumStockLevel: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input className="form-control" value={(form.imageUrl as string) || ''}
                  placeholder="https://…"
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <Select
                  required
                  value={form.category as string}
                  onChange={(category) => setForm({ ...form, category })}
                  options={optionsFrom(CATEGORIES.filter((c) => c !== 'All'))}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
