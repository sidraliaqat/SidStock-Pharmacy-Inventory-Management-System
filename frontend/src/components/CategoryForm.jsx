import { useState } from 'react';

export default function CategoryForm({ initialData, onSubmit, onCancel, submitting, serverErrors = [] }) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Category name is required.'); return; }
    setError('');
    onSubmit({ name: name.trim(), description: description.trim() });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-grid cols-1">
        <div className="field">
          <label>Category Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={error ? 'has-error' : ''} placeholder="e.g. Painkillers" autoFocus />
          {error && <span className="field-error">{error}</span>}
        </div>
        <div className="field">
          <label>Description <span className="optional-tag">(optional)</span></label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description of this category" />
        </div>
      </div>
      {serverErrors.length > 0 && (
        <div className="auth-error" style={{ marginTop: 14 }}>{serverErrors.join(' ')}</div>
      )}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save Category'}</button>
      </div>
    </form>
  );
}
