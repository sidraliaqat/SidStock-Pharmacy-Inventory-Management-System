import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownCircle, ArrowUpCircle, Search } from 'lucide-react';
import medicineService from '../services/medicineService';
import inventoryService from '../services/inventoryService';
import StatusBadge from './StatusBadge';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { resolveImageUrl, formatDateTime, initials } from '../utils/formatters';

export default function InventoryView({ basePath }) {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const loadRecent = async () => {
    setRecentLoading(true);
    try {
      const { data } = await inventoryService.history({ limit: 8 });
      setRecent(data.data);
    } catch {
      // non-critical panel, fail silently
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => { loadRecent(); }, []);

  // Pre-select a medicine when navigated here with ?medicine=<id>
  useEffect(() => {
    const preselect = searchParams.get('medicine');
    if (preselect) {
      medicineService.getById(preselect).then(({ data }) => setSelected(data.data)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const { data } = await medicineService.list({ search: query, limit: 6 });
        setResults(data.data);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const selectMedicine = (m) => {
    setSelected(m);
    setResults([]);
    setQuery('');
  };

  const resetForm = () => {
    setQuantity(''); setReason(''); setBatchNumber(''); setPurchasePrice(''); setExpiryDate('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected || !quantity || Number(quantity) <= 0 || !reason.trim()) {
      toast.error('Please select a medicine, a positive quantity, and a reason.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { quantity: Number(quantity), reason: reason.trim() };
      if (mode === 'IN') {
        if (batchNumber) payload.batch_number = batchNumber;
        if (purchasePrice) payload.purchase_price = Number(purchasePrice);
        if (expiryDate) payload.expiry_date = expiryDate;
        await inventoryService.stockIn(selected.id, payload);
        toast.success(`Stock added: +${quantity} unit(s) of ${selected.name}.`);
      } else {
        await inventoryService.stockOut(selected.id, payload);
        toast.success(`Stock removed: -${quantity} unit(s) of ${selected.name}.`);
      }
      const { data } = await medicineService.getById(selected.id);
      setSelected(data.data);
      resetForm();
      loadRecent();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Inventory</h1>
          <p className="subtitle">Record stock received (IN) or dispensed/sold (OUT). Every change is logged automatically.</p>
        </div>
      </div>

      <div className="detail-grid" style={{ gridTemplateColumns: '1fr 340px' }}>
        <div className="card card-pad">
          <div className="field" style={{ marginBottom: 18 }}>
            <label>Find Medicine</label>
            <div className="search-bar" style={{ maxWidth: 'none' }}>
              <Search size={15} className="search-icon" />
              <input placeholder="Search by name, generic name or SKU..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            {searching && <span className="field-hint">Searching…</span>}
            {results.length > 0 && (
              <div className="card" style={{ marginTop: 4 }}>
                {results.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => selectMedicine(m)}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>{m.name} <span className="cell-muted mono" style={{ fontSize: 12 }}>({m.sku})</span></span>
                    <span className="mono cell-muted">Qty: {m.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!selected ? (
            <EmptyState title="No medicine selected." description="Search and select a medicine above to record a stock movement." />
          ) : (
            <>
              <div className="record-card" style={{ marginBottom: 18 }}>
                <div className="record-card-top">
                  {resolveImageUrl(selected.image_url)
                    ? <img src={resolveImageUrl(selected.image_url)} alt={selected.name} className="med-thumb" />
                    : <div className="med-thumb-placeholder">{initials(selected.name)}</div>}
                  <div style={{ flex: 1 }}>
                    <div className="cell-primary">{selected.name}</div>
                    <div className="cell-muted mono" style={{ fontSize: 12 }}>{selected.sku} · Current stock: {selected.quantity}</div>
                  </div>
                  <StatusBadge status={selected.stock_status} />
                </div>
              </div>

              <div className="chip-group" style={{ marginBottom: 18 }}>
                <button
                  type="button"
                  className={`btn ${mode === 'IN' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMode('IN')}
                >
                  <ArrowUpCircle size={15} /> Stock IN
                </button>
                <button
                  type="button"
                  className={`btn ${mode === 'OUT' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMode('OUT')}
                >
                  <ArrowDownCircle size={15} /> Stock OUT
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="field">
                    <label>Quantity *</label>
                    <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 50" />
                  </div>
                  <div className="field">
                    <label>Reason *</label>
                    <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={mode === 'IN' ? 'e.g. New Shipment' : 'e.g. Sale'} />
                  </div>
                  {mode === 'IN' && (
                    <>
                      <div className="field">
                        <label>Batch Number <span className="optional-tag">(optional)</span></label>
                        <input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="e.g. PAN-24B" />
                      </div>
                      <div className="field">
                        <label>Purchase Price <span className="optional-tag">(optional)</span></label>
                        <input type="number" min="0" step="0.01" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0.00" />
                      </div>
                      <div className="field span-2">
                        <label>Expiry Date <span className="optional-tag">(optional)</span></label>
                        <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                      </div>
                    </>
                  )}
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Processing…' : mode === 'IN' ? 'Add Stock' : 'Remove Stock'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3>Recent Movements</h3></div>
          {recentLoading ? <LoadingSpinner inline label="Loading…" /> : recent.length === 0 ? (
            <div style={{ padding: 20 }}><EmptyState title="No movements yet." /></div>
          ) : (
            <div style={{ padding: 14 }}>
              {recent.map((h) => (
                <div key={h.id} style={{ padding: '10px 6px', borderBottom: '1px solid var(--border)', fontSize: 12.5 }}>
                  <div className="flex-between">
                    <strong>{h.medicine_name}</strong>
                    <span className={`badge ${h.transaction_type === 'IN' ? 'badge-in-stock' : 'badge-out-of-stock'}`}>
                      {h.transaction_type === 'IN' ? '+' : '-'}{h.quantity}
                    </span>
                  </div>
                  <div className="cell-muted" style={{ marginTop: 3 }}>{h.reason || '—'} · {formatDateTime(h.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
