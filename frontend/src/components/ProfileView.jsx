import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import RoleBadge from './RoleBadge';
import { useToast } from '../context/ToastContext';
import authService from '../services/authService';
import { getErrorMessage } from '../services/api';
import { initials } from '../utils/formatters';

export default function ProfileView() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');

  const handleNameSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await authService.updateProfile({ name: name.trim() });
      updateUser({ name: data.data.name });
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters long.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setSavingPassword(true);
    try {
      await authService.updateProfile({ password });
      toast.success('Password changed successfully.');
      setPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p className="subtitle">Manage your account details.</p>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          <div className="topbar-avatar" style={{ width: 56, height: 56, fontSize: 20 }}>{initials(user.name)}</div>
          <div>
            <h3 style={{ fontSize: 16 }}>{user.name}</h3>
            <p className="cell-muted" style={{ marginTop: 2 }}>{user.email}</p>
            <div style={{ marginTop: 6 }}><RoleBadge role={user.role} /></div>
          </div>
        </div>

        <form onSubmit={handleNameSave}>
          <div className="form-grid">
            <div className="field">
              <label>Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>Email address</label>
              <input value={user.email} disabled style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }} />
              <span className="field-hint">Email cannot be changed here.</span>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="card card-pad">
        <h3 style={{ marginBottom: 16 }}>Change Password</h3>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handlePasswordSave}>
          <div className="form-grid">
            <div className="field">
              <label>New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>
            <div className="field">
              <label>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={savingPassword}>
              {savingPassword ? 'Saving…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
