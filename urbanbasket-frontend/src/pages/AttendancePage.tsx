import { useEffect, useState } from 'react';
import { CalendarCheck, Plus, Search, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { attendanceApi, adminApi } from '../api/endpoints';
import { scenes } from '../assets/scenes';
import { PageBanner } from '../components/PageBanner';
import { optionsFrom, Select } from '../components/Select';
import { useAuth } from '../context/AuthContext';

interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  attendanceDate: string;
  date?: string;
  status: string;
  checkIn: string;
  checkOut: string;
  remarks: string;
}

interface Employee {
  id: number;
  fullName: string;
  role: string;
}

const STATUS_OPTS = ['All', 'PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE'];

const STATUS_BADGE: Record<string, string> = {
  PRESENT: 'badge-success',
  ABSENT: 'badge-danger',
  LATE: 'badge-warning',
  HALF_DAY: 'badge-yellow',
  LEAVE: 'badge-info',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  PRESENT: <CheckCircle size={13} />,
  ABSENT: <XCircle size={13} />,
  LATE: <Clock size={13} />,
  HALF_DAY: <Clock size={13} />,
  LEAVE: <Clock size={13} />,
};

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filtered, setFiltered] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const { isAdmin } = useAuth();

  const emptyForm = {
    userId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    checkInTime: '09:00',
    checkOutTime: '18:00',
    notes: '',
  };
  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attRes, empRes] = await Promise.all([
        attendanceApi.getAll(),
        isAdmin() ? adminApi.getAccounts() : Promise.resolve({ data: [] }),
      ]);
      setRecords(attRes.data);
      setEmployees(empRes.data.filter((e: Employee) => e.role !== 'CUSTOMER'));
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let result = records;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.employeeName?.toLowerCase().includes(q));
    }
    if (statusFilter !== 'All') {
      result = result.filter((r) => r.status === statusFilter);
    }
    setFiltered(result);
  }, [records, search, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await attendanceApi.markAttendance({
        employeeId: parseInt(form.userId),
        attendanceDate: form.date,
        status: form.status,
        checkIn: form.checkInTime || null,
        checkOut: form.checkOutTime || null,
        remarks: form.notes || null,
      });
      setShowModal(false);
      setForm(emptyForm);
      fetchData();
    } catch (err: unknown) {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to mark attendance.'
      );
    }
  };

  // Summary stats
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter((r) => (r.attendanceDate || r.date)?.startsWith(today));
  const presentToday = todayRecords.filter((r) => r.status === 'PRESENT').length;
  const absentToday = todayRecords.filter((r) => r.status === 'ABSENT').length;
  const lateToday = todayRecords.filter((r) => r.status === 'LATE').length;

  return (
    <div>
      <PageBanner image={scenes.attendance}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Track employee attendance records</p>
        </div>
        {isAdmin() && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Mark Attendance
          </button>
        )}
      </div>
      </PageBanner>

      {/* Today Summary */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card green">
          <div className="stat-icon green"><CheckCircle size={22} /></div>
          <div><div className="stat-label">Present Today</div><div className="stat-value">{presentToday}</div></div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red"><XCircle size={22} /></div>
          <div><div className="stat-label">Absent Today</div><div className="stat-value">{absentToday}</div></div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange"><Clock size={22} /></div>
          <div><div className="stat-label">Late Today</div><div className="stat-value">{lateToday}</div></div>
        </div>
        <div className="stat-card primary">
          <div className="stat-icon primary"><CalendarCheck size={22} /></div>
          <div><div className="stat-label">Total Records</div><div className="stat-value">{records.length}</div></div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            className="form-control"
            placeholder="Search employee…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          style={{ width: 'auto', minWidth: 150 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={optionsFrom(STATUS_OPTS)}
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
          <div className="empty-state-icon"><CalendarCheck size={28} /></div>
          <h3>No attendance records</h3>
          <p>Mark attendance to see records here.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.employeeName}</strong></td>
                  <td>{formatDate(r.attendanceDate)}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[r.status] ?? 'badge-neutral'}`}>
                      {STATUS_ICON[r.status]}
                      {r.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{r.checkIn || '—'}</td>
                  <td>{r.checkOut || '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Mark Attendance</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            {formError && <div className="alert alert-error mb-2">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Employee *</label>
                <Select
                  required
                  placeholder="Select employee…"
                  value={form.userId}
                  onChange={(userId) => setForm({ ...form, userId })}
                  options={[
                    { value: '', label: 'Select employee…' },
                    ...employees.map((employee) => ({
                      value: String(employee.id),
                      label: `${employee.fullName} (${employee.role})`,
                    })),
                  ]}
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-control" type="date" required value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <Select
                    required
                    value={form.status}
                    onChange={(status) => setForm({ ...form, status })}
                    options={optionsFrom(STATUS_OPTS.filter((s) => s !== 'All'))}
                  />
                </div>
              </div>
              {(form.status === 'PRESENT' || form.status === 'LATE') && (
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Check In</label>
                    <input className="form-control" type="time" value={form.checkInTime}
                      onChange={(e) => setForm({ ...form, checkInTime: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Check Out</label>
                    <input className="form-control" type="time" value={form.checkOutTime}
                      onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })} />
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-control" placeholder="Optional notes…" value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Mark Attendance</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
