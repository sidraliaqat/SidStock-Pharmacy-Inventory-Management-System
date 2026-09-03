import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isGmailAddress } from '../../utils/validators';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isGmailAddress(form.email)) {
      setError('Email must be a valid @gmail.com address.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setSubmitting(true);
    const result = await register(form.name.trim(), form.email.trim(), form.password);
    setSubmitting(false);
    if (!result.success) { setError(result.message); return; }
    navigate('/user/dashboard', { replace: true });
  };

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-mark"><Pill size={16} /></div>
          <span style={{ fontWeight: 700, fontSize: 17 }}>SidStock</span>
        </div>
        <div>
          <h2>Join your pharmacy's inventory workspace.</h2>
          <p>New accounts are created with staff-level access. An administrator can grant additional permissions if needed.</p>
        </div>
        <p style={{ fontSize: 12, color: '#8FC3B7' }}>© {new Date().getFullYear()} SidStock Pharmacy Inventory Management System</p>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <h1>Create a staff account</h1>
          <p className="auth-sub">Admin accounts are created by an administrator from the Users page.</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid cols-1">
              <div className="field">
                <label>Full Name</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Jane Doe" required autoFocus />
              </div>
              <div className="field">
                <label>Email address</label>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@gmail.com" required />
                <span className="field-hint">Must be a @gmail.com address.</span>
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="At least 8 characters" required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 18 }} disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
