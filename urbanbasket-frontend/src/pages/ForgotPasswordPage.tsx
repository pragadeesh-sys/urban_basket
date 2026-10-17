import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Eye, EyeOff, KeyRound, X } from 'lucide-react';
import { authApi } from '../api/endpoints';
import { AuthFrame } from '../components/AuthFrame';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [issuedOtp, setIssuedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setIssuedOtp(String(res.data.otp ?? ''));
      setCodeSent(true);
      setOtp('');
      setSuccess('Enter the 6-digit code with your new password.');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Could not create a reset code.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), otp.trim(), newPassword);
      setSuccess('Password updated. Redirecting to sign in…');
      window.setTimeout(() => navigate('/login'), 1200);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Could not reset the password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame>
      <div className="fresh-form">
        <div className="fresh-title-row">
          <Link to="/login" className="fresh-close" aria-label="Back to log in">
            <X size={20} />
          </Link>
          <h1>Reset Password</h1>
        </div>
        <p className="fresh-lead">Enter your email, then the one-time code and a new password.</p>

        {error && (
          <div className="fresh-alert error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="fresh-alert ok">
            <CheckCircle size={16} />
            {success}
          </div>
        )}

        {!codeSent ? (
          <form onSubmit={requestCode}>
            <label htmlFor="reset-email">Email Address</label>
            <input
              id="reset-email"
              type="email"
              placeholder="Enter email address*"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <button type="submit" className="fresh-submit" disabled={loading}>
              {loading ? 'Sending code…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword}>
            {issuedOtp && (
              <div className="fresh-alert ok">
                <KeyRound size={16} />
                Your code is <strong>{issuedOtp}</strong>
              </div>
            )}
            <label htmlFor="reset-otp">OTP</label>
            <input
              id="reset-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code*"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
            />
            <label htmlFor="reset-password">New Password</label>
            <div className="fresh-password">
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password*"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
                autoComplete="new-password"
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
            <label htmlFor="reset-confirm">Confirm Password</label>
            <input
              id="reset-confirm"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password*"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
            />
            <button type="submit" className="fresh-submit" disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
            <button
              type="button"
              className="fresh-text-btn"
              onClick={() => { setCodeSent(false); setIssuedOtp(''); setOtp(''); setError(''); }}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </AuthFrame>
  );
}
