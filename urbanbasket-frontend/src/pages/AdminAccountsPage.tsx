import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Trash2, X, UserCheck, UserX, ShieldCheck, Pencil } from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { scenes } from '../assets/scenes';
import { PageBanner } from '../components/PageBanner';
import { optionsFrom, Select } from '../components/Select';

interface Account {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'badge-danger',
  STAFF: 'badge-info',
  ACCOUNTANT: 'badge-warning',
  CUSTOMER: 'badge-success',
  SUPPLIER: 'badge-yellow',
};

export function AdminAccountsPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');

  const emptyForm = { fullName: '', email: '', phone: '', password: '', role: 'STAFF' };
  const [form, setForm] = useState<Record<string, string>>(emptyForm);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAccounts();
      setAccounts(res.data);
    } catch { setAccounts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const filtered = search
    ? accounts.filter(
        (a) =>
          a.fullName.toLowerCase().includes(search.toLowerCase()) ||
          a.email.toLowerCase().includes(search.toLowerCase()) ||
          a.role.toLowerCase().includes(search.toLowerCase())
      )
    : accounts;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (account: Account) => {
    setEditing(account);
    setForm({
      fullName: account.fullName,
      email: account.email,
      phone: account.phone ?? '',
      password: '',
      role: account.role,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editing) {
        await adminApi.updateAccount(editing.id, {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          role: form.role,
          password: form.password,
        });
      } else {
        await adminApi.createAccount(form);
      }
      setShowModal(false);
      setEditing(null);
      setForm(emptyForm);
      fetchAccounts();
    } catch (err: unknown) {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          || (editing ? 'Failed to update account.' : 'Failed to create account.')
      );
    }
  };

  const toggleStatus = async (id: number, active: boolean) => {
    try {
      await adminApi.updateAccountStatus(id, !active);
      fetchAccounts();
    } catch { alert('Failed to update status.'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this account? This cannot be undone.')) return;
    try {
      await adminApi.deleteAccount(id);
      fetchAccounts();
    } catch { alert('Failed to delete account.'); }
  };

  const stats = {
    total: accounts.length,
    admin: accounts.filter((a) => a.role === 'ADMIN').length,
    staff: accounts.filter((a) => a.role === 'STAFF').length,
    active: accounts.filter((a) => a.active).length,
  };

  return (
    <div>
      <PageBanner image={scenes.accounts}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Management</h1>
          <p className="page-subtitle">Manage system users and roles</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Create Account
        </button>
      </div>
      </PageBanner>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card primary"><div className="stat-icon primary"><Users size={22} /></div><div><div className="stat-label">Total Users</div><div className="stat-value">{stats.total}</div></div></div>
        <div className="stat-card green"><div className="stat-icon green"><UserCheck size={22} /></div><div><div className="stat-label">Active</div><div className="stat-value">{stats.active}</div></div></div>
        <div className="stat-card red"><div className="stat-icon red"><ShieldCheck size={22} /></div><div><div className="stat-label">Admins</div><div className="stat-value">{stats.admin}</div></div></div>
        <div className="stat-card orange"><div className="stat-icon orange"><Users size={22} /></div><div><div className="stat-label">Staff</div><div className="stat-value">{stats.staff}</div></div></div>
      </div>

      {/* Search */}
      <div className="filters-bar">
        <div className="search-bar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon" style={{ color: 'var(--text-muted)' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input className="form-control" placeholder="Search by name, email or role…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="loading-spinner" /></div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'white', flexShrink: 0 }}>
                        {a.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <strong>{a.fullName}</strong>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{a.email}</td>
                  <td><span className={`badge ${ROLE_BADGE[a.role] ?? 'badge-neutral'}`}>{a.role}</span></td>
                  <td>
                    <span className={`badge ${a.active ? 'badge-success' : 'badge-neutral'}`}>
                      {a.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn-ghost btn-sm edit-action"
                        onClick={() => a.role === 'ADMIN' ? navigate('/profile') : openEdit(a)}
                        title={a.role === 'ADMIN' ? 'Edit in My Profile' : 'Edit details'}
                      >
                        <Pencil size={14} /> Edit details
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => toggleStatus(a.id, a.active)}
                        disabled={a.role === 'ADMIN'}
                        title={a.role === 'ADMIN' ? 'Administrator status stays active' : a.active ? 'Deactivate' : 'Activate'}
                        style={{ color: a.role === 'ADMIN' ? undefined : a.active ? 'var(--accent)' : 'var(--secondary)' }}
                      >
                        {a.active ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                      <button
                        className="btn btn-danger btn-icon btn-sm"
                        onClick={() => handleDelete(a.id)}
                        disabled={a.role === 'ADMIN'}
                        title={a.role === 'ADMIN' ? 'Administrator accounts cannot be deleted' : 'Delete'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Account Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Edit details' : 'Create Account'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            {formError && <div className="alert alert-error mb-2">{formError}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-control" required value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-control" type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@urbanbasket.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.phone} maxLength={20}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" />
              </div>
              <div className="form-group">
                <label className="form-label">{editing ? 'New password' : 'Password *'}</label>
                <input className="form-control" type="password" required={!editing} minLength={editing ? undefined : 6} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editing ? 'Leave blank to keep the current password' : 'Min. 6 characters'} />
              </div>
              {editing?.role === 'CUSTOMER' || editing?.role === 'SUPPLIER' ? (
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input className="form-control" value={editing.role} readOnly />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <Select
                    required
                    value={form.role}
                    onChange={(role) => setForm({ ...form, role })}
                    options={optionsFrom(['STAFF', 'ACCOUNTANT'])}
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save details' : 'Create Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
