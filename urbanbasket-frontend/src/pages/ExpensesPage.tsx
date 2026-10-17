import { useEffect, useState } from 'react';
import { Receipt, Plus, Trash2, Edit, X, Filter } from 'lucide-react';
import { expenseApi } from '../api/endpoints';
import { scenes } from '../assets/scenes';
import { PageBanner } from '../components/PageBanner';
import { optionsFrom, Select } from '../components/Select';

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  description: string;
  expenseDate: string;
  recordedByName: string;
}

const EXPENSE_CATEGORIES = [
  'All', 'Utilities', 'Salaries', 'Rent', 'Maintenance', 'Marketing',
  'Transport', 'Office Supplies', 'Other',
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filtered, setFiltered] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [formError, setFormError] = useState('');

  const emptyForm = { title: '', amount: '', category: 'Other', description: '', date: new Date().toISOString().split('T')[0] };
  const [form, setForm] = useState<Record<string, string>>(emptyForm);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await expenseApi.getAll();
      setExpenses(res.data);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  useEffect(() => {
    if (categoryFilter === 'All') setFiltered(expenses);
    else setFiltered(expenses.filter((e) => e.category === categoryFilter));
  }, [expenses, categoryFilter]);

  const totalExpenses = filtered.reduce((acc, e) => acc + e.amount, 0);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      description: expense.description || '',
      date: expense.expenseDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const payload = {
      title: form.title,
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount),
      expenseDate: form.date,
    };
    try {
      if (editing) await expenseApi.update(editing.id, payload);
      else await expenseApi.create(payload);
      setShowModal(false);
      fetchExpenses();
    } catch (err: unknown) {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save expense.'
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await expenseApi.delete(id);
      fetchExpenses();
    } catch { alert('Failed to delete.'); }
  };

  return (
    <div>
      <PageBanner image={scenes.expenses}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Track and manage business expenses</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Expense
        </button>
      </div>
      </PageBanner>

      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card primary">
          <div className="stat-icon primary"><Receipt size={22} /></div>
          <div><div className="stat-label">Total Expenses</div><div className="stat-value">{formatCurrency(totalExpenses)}</div></div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange"><Filter size={22} /></div>
          <div><div className="stat-label">Filtered Count</div><div className="stat-value">{filtered.length}</div></div>
        </div>
      </div>

      {/* Filter */}
      <div className="filters-bar">
        <Select
          style={{ width: 'auto', minWidth: 200 }}
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={optionsFrom(EXPENSE_CATEGORIES)}
        />
        {categoryFilter !== 'All' && (
          <button className="btn btn-ghost btn-sm" onClick={() => setCategoryFilter('All')}><X size={14} /> Clear</button>
        )}
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="loading-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Receipt size={28} /></div>
          <h3>No expenses found</h3>
          <p>Add your first expense to get started.</p>
          <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Add Expense</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Added By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.title}</strong>
                    {e.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.description}</div>}
                  </td>
                  <td><span className="badge badge-info">{e.category}</span></td>
                  <td><strong style={{ color: 'var(--accent)' }}>{formatCurrency(e.amount)}</strong></td>
                  <td>{formatDate(e.expenseDate)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{e.recordedByName || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(e)}><Edit size={14} /></button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(e.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
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
              <h3 className="modal-title">{editing ? 'Edit Expense' : 'Add Expense'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            {formError && <div className="alert alert-error mb-2">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-control" required value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Electricity Bill" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input className="form-control" type="number" step="0.01" min="0" required value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-control" type="date" required value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <Select
                  required
                  value={form.category}
                  onChange={(category) => setForm({ ...form, category })}
                  options={optionsFrom(EXPENSE_CATEGORIES.filter((c) => c !== 'All'))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-control" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional details…" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
