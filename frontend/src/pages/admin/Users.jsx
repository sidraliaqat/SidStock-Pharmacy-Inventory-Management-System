import { useEffect, useState } from 'react';
import { Plus, Trash2, ShieldCheck, ShieldOff } from 'lucide-react';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import RoleBadge from '../../components/RoleBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage, getErrorList } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { isGmailAddress } from '../../utils/validators';

function NewUserForm({ onSubmit, onCancel, submitting, serverErrors }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [localError, setLocalError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isGmailAddress(form.email)) {
      setLocalError('Email must be a valid @gmail.com address.');
      return;
    }
    setLocalError('');
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-grid cols-1">
        <div className="field"><label>Full Name *</label><input value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus /></div>
        <div className="field">
          <label>Email *</label>
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@gmail.com" required />
          <span className="field-hint">Must be a @gmail.com address.</span>
        </div>
        <div className="field"><label>Password *</label><input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="At least 8 characters" required /></div>
        <div className="field">
          <label>Role *</label>
          <select value={form.role} onChange={(e) => set('role', e.target.value)}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      {(localError || serverErrors.length > 0) && (
        <div className="auth-error" style={{ marginTop: 14 }}>{localError || serverErrors.join(' ')}</div>
      )}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating…' : 'Create User'}</button>
      </div>
    </form>
  );
}

export default function Users() {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await userService.list();
      setUsers(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (payload) => {
    setSubmitting(true);
    setServerErrors([]);
    try {
      await userService.create(payload);
      toast.success('User account created successfully.');
      setShowAdd(false);
      load();
    } catch (err) {
      setServerErrors(getErrorList(err) || [getErrorMessage(err)]);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      await userService.update(u.id, { is_active: !u.is_active });
      toast.success(`${u.name} is now ${u.is_active ? 'deactivated' : 'active'}.`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await userService.remove(deleteTarget.id);
      toast.success('User deleted successfully.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading users..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="subtitle">Manage admin and staff accounts.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { setServerErrors([]); setShowAdd(true); }}><Plus size={15} /> Add User</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="cell-primary">{u.name} {u.id === currentUser.id && <span className="cell-muted">(you)</span>}</td>
                  <td className="cell-muted">{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-in-stock' : 'badge-out-of-stock'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="cell-muted">{formatDate(u.created_at)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn-ghost btn-icon"
                        title={u.is_active ? 'Deactivate' : 'Activate'}
                        onClick={() => toggleActive(u)}
                        disabled={u.id === currentUser.id}
                      >
                        {u.is_active ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                      </button>
                      <button
                        className="btn btn-ghost btn-icon"
                        title="Delete"
                        onClick={() => setDeleteTarget(u)}
                        disabled={u.id === currentUser.id}
                      >
                        <Trash2 size={15} color="var(--status-out-fg)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <Modal title="Add User" onClose={() => setShowAdd(false)}>
          <NewUserForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} submitting={submitting} serverErrors={serverErrors} />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete User"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
