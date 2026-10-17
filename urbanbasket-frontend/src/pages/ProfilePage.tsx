import { useEffect, useState, type FormEvent } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { authApi } from '../api/endpoints';
import { scenes } from '../assets/scenes';
import { PageBanner } from '../components/PageBanner';
import { useAuth, type User } from '../context/AuthContext';

export function ProfilePage() {
  const { user, updateSession } = useAuth();
  const [profile, setProfile] = useState<User | null>(user);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authApi.me().then((res) => {
      const current = res.data as User;
      setProfile(current);
      setFullName(current.fullName);
      setEmail(current.email);
      setPhone(current.phone ?? '');
    }).catch(() => {
      setProfile(user);
    });
  }, []);

  const startEdit = () => {
    setFullName(profile?.fullName ?? '');
    setEmail(profile?.email ?? '');
    setPhone(profile?.phone ?? '');
    setPassword('');
    setConfirm('');
    setError('');
    setNotice('');
    setEditing(true);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (password && password !== confirm) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (password && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      const res = await authApi.updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      const updated = res.data.user as User;
      updateSession(updated, res.data.token as string);
      setProfile(updated);
      setPassword('');
      setConfirm('');
      setEditing(false);
      setNotice('Your details were updated.');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          || 'Could not update your details.'
      );
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.fullName || 'A')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div>
      <PageBanner image={scenes.profile}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">
            {profile?.role === 'CUSTOMER' ? 'Update your account details.' : 'Update your administrator details.'}
          </p>
        </div>
        {!editing && (
          <button className="btn btn-primary" onClick={startEdit}>
            <Pencil size={16} /> Edit details
          </button>
        )}
      </div>
      </PageBanner>

      {error && <div className="alert alert-error mb-2"><X size={16} />{error}</div>}
      {notice && <div className="alert alert-success mb-2"><Check size={16} />{notice}</div>}

      <div className="card" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '1.1rem',
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>{profile?.fullName}</div>
            <span className={`badge ${profile?.role === 'CUSTOMER' ? 'badge-success' : 'badge-danger'}`}>{profile?.role ?? 'ADMIN'}</span>
          </div>
        </div>

        {editing ? (
          <form onSubmit={save}>
            <div className="form-group">
              <label className="form-label">Full name *</label>
              <input className="form-control" required minLength={2} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-control" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" />
            </div>
            <div className="form-group">
              <label className="form-label">New password</label>
              <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep the current password" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm new password</label>
              <input className="form-control" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat the new password" />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save details'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Email</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{profile?.email}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Phone</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{profile?.phone || '—'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
