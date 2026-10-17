import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/endpoints';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { AuthFrame } from '../components/AuthFrame';

export function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    setLoading(true);
    try {
      await authApi.register({
        fullName,
        email: form.email,
        password: form.password,
      });
      setSuccess('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Registration failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame>
      <form className="fresh-form fresh-form-register" onSubmit={handleSubmit}>
        <div className="fresh-title-row">
          <Link to="/login" className="fresh-close" aria-label="Back to log in">
            <X size={20} />
          </Link>
          <h1>Create A Profile</h1>
        </div>
        <p className="fresh-lead">Sign up and shop fresh groceries, with delivery from the store.</p>

        {error && (
          <div className="fresh-alert error">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="fresh-alert ok">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <div className="fresh-row">
          <div>
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="First name*"
              value={form.firstName}
              onChange={handleChange}
              required
              autoComplete="given-name"
            />
          </div>
          <div>
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Last name*"
              value={form.lastName}
              onChange={handleChange}
              required
              autoComplete="family-name"
            />
          </div>
        </div>

        <label htmlFor="register-email">Email Address</label>
        <input
          id="register-email"
          name="email"
          type="email"
          placeholder="Enter email address*"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />

        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          name="password"
          type="password"
          placeholder="Enter password*"
          value={form.password}
          onChange={handleChange}
          required
          minLength={8}
          autoComplete="new-password"
        />

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Enter password*"
          value={form.confirmPassword}
          onChange={handleChange}
          required
          autoComplete="new-password"
        />

        <button type="submit" className="fresh-submit" disabled={loading || !!success}>
          {loading ? 'Creating account…' : 'Sign Up'}
        </button>
      </form>
    </AuthFrame>
  );
}
