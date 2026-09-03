import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Pill, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    const redirectTo = location.state?.from?.pathname ||
      (result.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
    navigate(redirectTo, { replace: true });
  };

  const fillDemo = (role) => {
    if (role === 'admin') { setEmail('SidStock.admin@gmail.com'); setPassword('Admin@12345'); }
    else { setEmail('SidStock.staff@gmail.com'); setPassword('Staff@12345'); }
  };

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-mark"><Pill size={16} /></div>
          <span style={{ fontWeight: 700, fontSize: 22 }}>SidStock</span>
        </div>
        <div>
          <h1>Complete visibility over your pharmacy's inventory, in one place.</h1>
          <p>Track stock levels, batches, suppliers and expiry dates in real time  with role-based access for your whole team.</p>
        </div>
        <p style={{ fontSize: 12, color: '#8FC3B7' }}>© SidStock Pharmacy Inventory Management System</p>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="auth-sub">Sign in to manage your pharmacy inventory.</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid cols-1">
              <div className="field">
                <label>Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" required autoFocus />
              </div>
              <div className="field">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ paddingRight: 38, width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)' }}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 18 }} disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

       

          <p className="auth-footer-link">
            Don't have an account? <Link to="/register">Create a staff account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
