import { useEffect, useState } from 'react';
import { Truck, Plus, Edit, Trash2, X, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { supplierApi } from '../api/endpoints';
import { scenes } from '../assets/scenes';
import { PageBanner } from '../components/PageBanner';

interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  hasLogin?: boolean;
  loginEmail?: string;
}

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [loginFor, setLoginFor] = useState<Supplier | null>(null);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [formError, setFormError] = useState('');

  const emptyForm = { name: '', contactPerson: '', email: '', phone: '', address: '', password: '', loginName: '' };
  const [form, setForm] = useState<Record<string, string>>(emptyForm);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await supplierApi.getAll();
      setSuppliers(res.data);
    } catch { setSuppliers([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormError(''); setShowModal(true); };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, contactPerson: s.contactPerson || '', email: s.email || '', phone: s.phone || '', address: s.address || '', password: '', loginName: '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editing) await supplierApi.update(editing.id, form);
      else await supplierApi.create(form);
      setShowModal(false);
      fetchSuppliers();
    } catch (err: unknown) {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save supplier.'
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this supplier?')) return;
    try { await supplierApi.delete(id); fetchSuppliers(); }
    catch { alert('Failed to delete.'); }
  };

  return (
    <div>
      <PageBanner image={scenes.suppliers}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">{suppliers.length} registered suppliers</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Supplier
        </button>
      </div>
      </PageBanner>

      {loading ? (
        <div className="loading-overlay"><div className="loading-spinner" /></div>
      ) : suppliers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Truck size={28} /></div>
          <h3>No suppliers yet</h3>
          <p>Add your first supplier to start tracking purchases.</p>
          <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Add Supplier</button>
        </div>
      ) : (
        <div className="supplier-grid">
          {suppliers.map((s) => (
            <div key={s.id} className="card supplier-card">
              <div className="supplier-card-top">
                <div className="supplier-identity">
                  <div className="supplier-mark">
                    <Building2 size={20} />
                  </div>
                  <div className="supplier-copy">
                    <div className="supplier-name">{s.name}</div>
                    {s.contactPerson && <div className="supplier-contact">Contact: {s.contactPerson}</div>}
                    <span className={`badge supplier-badge ${s.hasLogin ? 'badge-success' : 'badge-neutral'}`}>
                      {s.hasLogin ? `Login ${s.loginEmail}` : 'No login'}
                    </span>
                  </div>
                </div>
                <div className="supplier-actions">
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(s)} title="Edit"><Edit size={14} /></button>
                  <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(s.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="supplier-meta">
                {s.email && (
                  <div className="supplier-meta-row">
                    <Mail size={13} color="var(--text-muted)" /> {s.email}
                  </div>
                )}
                {s.phone && (
                  <div className="supplier-meta-row">
                    <Phone size={13} color="var(--text-muted)" /> {s.phone}
                  </div>
                )}
                {s.address && (
                  <div className="supplier-meta-row">
                    <MapPin size={13} color="var(--text-muted)" /> {s.address}
                  </div>
                )}
              </div>
              {!s.hasLogin && (
                <button className="btn btn-ghost btn-sm supplier-login-btn" onClick={() => { setLoginFor(s); setForm({ ...emptyForm, loginName: s.contactPerson || '', email: s.email || '' }); setFormError(''); }}>
                  Create login
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            {formError && <div className="alert alert-error mb-2">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input className="form-control" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fresh Farms Ltd." />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input className="form-control" value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Full name" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" type="tel" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-control" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
              </div>
              {!editing && (
                <div className="form-group">
                  <label className="form-label">Login password</label>
                  <input className="form-control" type="password" minLength={6} value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Optional. At least 6 characters so the supplier can sign in." />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Add Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loginFor && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setLoginFor(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Supplier login</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setLoginFor(null)}><X size={16} /></button>
            </div>
            {formError && <div className="alert alert-error mb-2">{formError}</div>}
            <form onSubmit={async (event) => {
              event.preventDefault();
              setFormError('');
              try {
                await supplierApi.createLogin(loginFor.id, {
                  fullName: form.loginName,
                  email: form.email,
                  password: form.password,
                });
                setLoginFor(null);
                fetchSuppliers();
              } catch (err: unknown) {
                setFormError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not create the login.');
              }
            }}>
              <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>{loginFor.name}</p>
              <div className="form-group">
                <label className="form-label">Full name *</label>
                <input className="form-control" required value={form.loginName} onChange={(e) => setForm({ ...form, loginName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Login email *</label>
                <input className="form-control" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-control" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setLoginFor(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create login</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
