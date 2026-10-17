import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { AuthFrame } from '../components/AuthFrame';

export function LoginPage() {
  const [email, setEmail] = useState('admin@urbanbasket.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const signedIn = await login(email, password);
      const destination = signedIn.role === 'CUSTOMER'
        ? '/products'
        : signedIn.role === 'SUPPLIER'
          ? '/purchases'
          : '/dashboard';
      navigate(destination);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Invalid email or password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame>
      <form className="fresh-form" onSubmit={handleSubmit}>
        <h1>Log In</h1>

        {error && (
          <div className="fresh-alert error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          placeholder="Enter email address*"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <label htmlFor="password">Enter Password</label>
        <div className="fresh-password">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter password*"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            className="fresh-eye"
            onClick={() => setShowPassword((open) => !open)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <Link to="/forgot-password" className="fresh-forgot">Forgot password?</Link>

        <button id="login-btn" type="submit" className="fresh-submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Log In'}
        </button>

        <p className="fresh-switch">
          New to UrbanBasket? <Link to="/register">Create a profile</Link>
        </p>
        <p className="fresh-demo">Demo · admin@urbanbasket.com · Admin@123</p>
      </form>
    </AuthFrame>
  );
}
