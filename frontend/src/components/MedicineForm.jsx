import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { resolveImageUrl } from '../utils/formatters';

const emptyForm = {
  name: '', generic_name: '', sku: '', description: '',
  category_id: '', supplier_id: '', price: '', quantity: '', minimum_stock: '10',
  batch_number: '', purchase_price: '', expiry_date: '',
};

export default function MedicineForm({
  mode = 'create', initialData, categories = [], suppliers = [],
  onSubmit, submitting, serverErrors = [],
}) {
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    ...(initialData ? {
      name: initialData.name || '',
      generic_name: initialData.generic_name || '',
      sku: initialData.sku || '',
      description: initialData.description || '',
      category_id: initialData.category_id || '',
      supplier_id: initialData.supplier_id || '',
      price: initialData.price ?? '',
      quantity: initialData.quantity ?? '',
      minimum_stock: initialData.minimum_stock ?? '10',
    } : {}),
  }));
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(resolveImageUrl(initialData?.image_url) || null);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Medicine name is required.';
    if (!form.sku.trim()) e.sku = 'SKU is required.';
    if (!form.category_id) e.category_id = 'Please select a category.';
    if (!form.supplier_id) e.supplier_id = 'Please select a supplier.';
    if (!form.price || Number(form.price) <= 0) e.price = 'Price must be greater than 0.';
    if (mode === 'create' && (form.quantity === '' || Number(form.quantity) < 0)) e.quantity = 'Quantity cannot be negative.';
    if (form.minimum_stock === '' || Number(form.minimum_stock) < 0) e.minimum_stock = 'Minimum stock cannot be negative.';
    if (mode === 'create' && form.batch_number && !form.expiry_date) e.expiry_date = 'Expiry date is required when a batch number is set.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('generic_name', form.generic_name.trim());
    fd.append('sku', form.sku.trim());
    fd.append('description', form.description.trim());
    fd.append('category_id', form.category_id);
    fd.append('supplier_id', form.supplier_id);
    fd.append('price', form.price);
    fd.append('minimum_stock', form.minimum_stock);
    if (mode === 'create') {
      fd.append('quantity', form.quantity || 0);
      if (form.batch_number) fd.append('batch_number', form.batch_number);
      if (form.purchase_price) fd.append('purchase_price', form.purchase_price);
      if (form.expiry_date) fd.append('expiry_date', form.expiry_date);
    }
    if (imageFile) fd.append('image', imageFile);

    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div
        className="image-drop"
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        {preview
          ? <img src={preview} alt="Preview" />
          : <div className="placeholder-icon"><ImagePlus size={22} /></div>}
        <div className="image-drop-text">
          <strong>Click to upload</strong> a medicine image<br />
          JPG, PNG or WEBP, up to 5MB
        </div>
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" hidden onChange={handleImage} />
      </div>

      <div className="form-grid" style={{ marginTop: 20 }}>
        <div className="field">
          <label>Medicine Name *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} className={errors.name ? 'has-error' : ''} placeholder="e.g. Panadol" />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>
        <div className="field">
          <label>Generic Name <span className="optional-tag">(optional)</span></label>
          <input value={form.generic_name} onChange={(e) => set('generic_name', e.target.value)} placeholder="e.g. Paracetamol" />
        </div>

        <div className="field">
          <label>SKU *</label>
          <input value={form.sku} onChange={(e) => set('sku', e.target.value)} className={errors.sku ? 'has-error' : ''} placeholder="e.g. MED-001" />
          {errors.sku && <span className="field-error">{errors.sku}</span>}
        </div>
        <div className="field">
          <label>Category *</label>
          <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)} className={errors.category_id ? 'has-error' : ''}>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.category_id && <span className="field-error">{errors.category_id}</span>}
        </div>

        <div className="field">
          <label>Supplier *</label>
          <select value={form.supplier_id} onChange={(e) => set('supplier_id', e.target.value)} className={errors.supplier_id ? 'has-error' : ''}>
            <option value="">Select supplier</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.supplier_id && <span className="field-error">{errors.supplier_id}</span>}
        </div>
        <div className="field">
          <label>Price (per unit) *</label>
          <input type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} className={errors.price ? 'has-error' : ''} placeholder="0.00" />
          {errors.price && <span className="field-error">{errors.price}</span>}
        </div>

        {mode === 'create' && (
          <div className="field">
            <label>Opening Quantity *</label>
            <input type="number" min="0" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} className={errors.quantity ? 'has-error' : ''} placeholder="0" />
            {errors.quantity && <span className="field-error">{errors.quantity}</span>}
          </div>
        )}
        <div className="field">
          <label>Minimum Stock *</label>
          <input type="number" min="0" value={form.minimum_stock} onChange={(e) => set('minimum_stock', e.target.value)} className={errors.minimum_stock ? 'has-error' : ''} />
          <span className="field-hint">Below this level, the medicine is flagged LOW STOCK.</span>
          {errors.minimum_stock && <span className="field-error">{errors.minimum_stock}</span>}
        </div>

        {mode === 'create' && (
          <>
            <div className="field">
              <label>Batch Number <span className="optional-tag">(optional)</span></label>
              <input value={form.batch_number} onChange={(e) => set('batch_number', e.target.value)} placeholder="e.g. PAN-24A" />
            </div>
            <div className="field">
              <label>Purchase Price <span className="optional-tag">(optional)</span></label>
              <input type="number" min="0" step="0.01" value={form.purchase_price} onChange={(e) => set('purchase_price', e.target.value)} placeholder="0.00" />
            </div>
            <div className="field">
              <label>Expiry Date {form.batch_number && '*'}</label>
              <input type="date" value={form.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} className={errors.expiry_date ? 'has-error' : ''} />
              {errors.expiry_date && <span className="field-error">{errors.expiry_date}</span>}
            </div>
          </>
        )}

        <div className="field span-2">
          <label>Description <span className="optional-tag">(optional)</span></label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Notes, dosage form, usage instructions..." />
        </div>
      </div>

      {serverErrors.length > 0 && (
        <div className="auth-error" style={{ marginTop: 18 }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {serverErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Add Medicine' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
