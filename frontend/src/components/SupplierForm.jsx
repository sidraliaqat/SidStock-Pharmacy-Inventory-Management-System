import { useState } from 'react';

const PK_PHONE_PATTERN = /^(\+92\d{10}|0\d{10}|\+92-\d{3}-\d{7})$/;

export default function SupplierForm({ initialData, onSubmit, onCancel, submitting, serverErrors = [] }) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Supplier name is required.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.email = 'Enter a valid email address.';
    }
    if (form.phone && !PK_PHONE_PATTERN.test(form.phone.trim())) {
      errs.phone = 'Use +92XXXXXXXXXX, 0XXXXXXXXXX, or +92-XXX-XXXXXXX.';
    }
    if (!form.email.trim() && !form.phone.trim()) {
      errs.email = 'Provide at least an email or a phone number.';
      errs.phone = 'Provide at least an email or a phone number.';
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-grid cols-1">
        <div className="field">
          <label>Supplier Name *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} className={errors.name ? 'has-error' : ''} placeholder="e.g. ABC Pharma" autoFocus />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>
        <div className="field">
          <label>Email <span className="optional-tag">(email or phone required)</span></label>
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={errors.email ? 'has-error' : ''} placeholder="contact@supplier.com" />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
        <div className="field">
          <label>Phone <span className="optional-tag">(email or phone required)</span></label>
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={errors.phone ? 'has-error' : ''} placeholder="+92-300-1112233" />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>
        <div className="field">
          <label>Address <span className="optional-tag">(optional)</span></label>
          <textarea value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street, City, Country" />
        </div>
      </div>
      {serverErrors.length > 0 && (
        <div className="auth-error" style={{ marginTop: 14 }}>{serverErrors.join(' ')}</div>
      )}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save Supplier'}</button>
      </div>
    </form>
  );
}