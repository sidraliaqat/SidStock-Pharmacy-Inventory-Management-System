import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Pencil, Trash2, PackagePlus } from 'lucide-react';
import medicineService from '../services/medicineService';
import inventoryService from '../services/inventoryService';
import StatusBadge from './StatusBadge';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import EmptyState from './EmptyState';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { resolveImageUrl, formatCurrency, formatDate, formatDateTime, initials } from '../utils/formatters';

export default function MedicineDetailView({ basePath, isAdmin }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [medicine, setMedicine] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [medRes, histRes] = await Promise.all([
        medicineService.getById(id),
        inventoryService.historyForMedicine(id, { limit: 50 }),
      ]);
      setMedicine(medRes.data.data);
      setHistory(histRes.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await medicineService.remove(id);
      toast.success('Medicine deleted successfully.');
      navigate(`${basePath}/medicines`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading medicine details..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!medicine) return null;

  const src = resolveImageUrl(medicine.image_url);
  const overallStatus = medicine.stock_status === 'OUT OF STOCK'
    ? medicine.stock_status
    : medicine.expiry_status !== 'OK' ? medicine.expiry_status : medicine.stock_status;

  return (
    <>
      <Link to={`${basePath}/medicines`} className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>
        <ChevronLeft size={15} /> Back to Medicines
      </Link>

      <div className="page-header">
        <div>
          <h1>{medicine.name}</h1>
          <p className="subtitle mono">{medicine.sku}</p>
        </div>
        <div className="page-header-actions">
          <Link to={`${basePath}/inventory?medicine=${medicine.id}`} className="btn btn-secondary">
            <PackagePlus size={15} /> Stock In / Out
          </Link>
          {isAdmin && (
            <>
              <Link to={`${basePath}/medicines/${medicine.id}/edit`} className="btn btn-secondary"><Pencil size={15} /> Edit</Link>
              <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /> Delete</button>
            </>
          )}
        </div>
      </div>

      <div className="card card-pad">
        <div className="detail-grid">
          <div>
            {src ? <img src={src} alt={medicine.name} className="detail-image" /> : (
              <div className="detail-image-placeholder">{initials(medicine.name)}</div>
            )}
            <div style={{ marginTop: 12 }}>
              <StatusBadge status={overallStatus} />
            </div>
          </div>

          <div>
            <div className="tabs">
              <div className={`tab ${tab === 'details' ? 'active' : ''}`} onClick={() => setTab('details')}>Details</div>
              <div className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Inventory History</div>
            </div>

            {tab === 'details' ? (
              <>
                <div className="detail-list">
                  <div className="detail-item"><div className="k">Generic Name</div><div className="v">{medicine.generic_name || '—'}</div></div>
                  <div className="detail-item"><div className="k">SKU</div><div className="v mono">{medicine.sku}</div></div>
                  <div className="detail-item"><div className="k">Category</div><div className="v">{medicine.category_name || '—'}</div></div>
                  <div className="detail-item"><div className="k">Supplier</div><div className="v">{medicine.supplier_name || '—'}</div></div>
                  <div className="detail-item"><div className="k">Price</div><div className="v mono">{formatCurrency(medicine.price)}</div></div>
                  <div className="detail-item"><div className="k">Current Stock</div><div className="v mono">{medicine.quantity} units</div></div>
                  <div className="detail-item"><div className="k">Minimum Stock</div><div className="v mono">{medicine.minimum_stock} units</div></div>
                  <div className="detail-item"><div className="k">Latest Batch</div><div className="v mono">{medicine.latest_batch_number || '—'}</div></div>
                  <div className="detail-item"><div className="k">Purchase Price</div><div className="v mono">{medicine.latest_purchase_price ? formatCurrency(medicine.latest_purchase_price) : '—'}</div></div>
                  <div className="detail-item"><div className="k">Expiry Date</div><div className="v mono">{formatDate(medicine.nearest_expiry)}</div></div>
                  <div className="detail-item"><div className="k">Created At</div><div className="v">{formatDateTime(medicine.created_at)}</div></div>
                  <div className="detail-item"><div className="k">Updated At</div><div className="v">{formatDateTime(medicine.updated_at)}</div></div>
                </div>
                {medicine.description && (
                  <>
                    <div className="section-title">Description</div>
                    <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>{medicine.description}</p>
                  </>
                )}
              </>
            ) : (
              history.length === 0 ? (
                <EmptyState title="No inventory history yet." description="Stock movements for this medicine will appear here." />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Type</th><th>Quantity</th><th>Stock Change</th><th>Reason</th><th>By</th><th>Date</th></tr></thead>
                    <tbody>
                      {history.map((h) => (
                        <tr key={h.id}>
                          <td>
                            <span className={`badge ${h.transaction_type === 'IN' ? 'badge-in-stock' : 'badge-out-of-stock'}`}>
                              {h.transaction_type}
                            </span>
                          </td>
                          <td className="mono">{h.transaction_type === 'IN' ? '+' : '-'}{h.quantity}</td>
                          <td className="mono cell-muted">{h.previous_quantity} → {h.new_quantity}</td>
                          <td className="cell-muted">{h.reason || '—'}</td>
                          <td className="cell-muted">{h.user_name || 'System'}</td>
                          <td className="cell-muted">{formatDateTime(h.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Medicine"
          message={`Are you sure you want to delete "${medicine.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
