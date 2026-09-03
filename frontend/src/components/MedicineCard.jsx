import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { resolveImageUrl, formatCurrency, formatDate, initials } from '../utils/formatters';

/** Compact medicine card used in dashboard panels (e.g. low-stock list). */
export default function MedicineCard({ medicine, basePath, statusOverride }) {
  const src = resolveImageUrl(medicine.image_url);
  return (
    <Link to={`${basePath}/medicines/${medicine.id}`} className="record-card" style={{ display: 'block' }}>
      <div className="record-card-top">
        {src ? <img src={src} alt={medicine.name} className="med-thumb" /> : <div className="med-thumb-placeholder">{initials(medicine.name)}</div>}
        <div style={{ flex: 1 }}>
          <div className="cell-primary">{medicine.name}</div>
          <div className="cell-muted" style={{ fontSize: 12 }}>{medicine.category_name || '—'}</div>
        </div>
        <StatusBadge status={statusOverride || medicine.stock_status} />
      </div>
      <div className="record-card-body">
        <div><span className="k">Qty:</span> {medicine.quantity}</div>
        <div><span className="k">Price:</span> {formatCurrency(medicine.price)}</div>
        {medicine.nearest_expiry && <div><span className="k">Expiry:</span> {formatDate(medicine.nearest_expiry)}</div>}
      </div>
    </Link>
  );
}
