import { Link } from 'react-router-dom';
import { Eye, Pencil, Trash2, ArrowUpDown, RotateCcw } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { resolveImageUrl, formatCurrency, formatDate, initials } from '../utils/formatters';

const SORTABLE = { name: 'name', price: 'price', quantity: 'quantity', expiry_date: 'expiry_date' };

export default function MedicineTable({
  medicines, basePath, isAdmin, sort, onSortChange, onDelete,
  isDeletedView, onRestore, restoringId,
}) {
  const toggleSort = (field) => {
    if (!onSortChange) return;
    const active = sort?.replace('-', '');
    const desc = sort?.startsWith('-');
    if (active === field) {
      onSortChange(desc ? field : `-${field}`);
    } else {
      onSortChange(field);
    }
  };

  const Thumb = ({ m }) => {
    const src = resolveImageUrl(m.image_url);
    return src
      ? <img src={src} alt={m.name} className="med-thumb" />
      : <div className="med-thumb-placeholder">{initials(m.name)}</div>;
  };

  const overallStatus = (m) => (m.stock_status === 'OUT OF STOCK'
    ? m.stock_status
    : m.expiry_status !== 'OK' ? m.expiry_status : m.stock_status);

  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th className="sortable" onClick={() => toggleSort(SORTABLE.name)}>
                Medicine <ArrowUpDown size={11} style={{ verticalAlign: -1 }} />
              </th>
              <th>Generic Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Supplier</th>
              <th className="sortable" onClick={() => toggleSort(SORTABLE.price)}>Price</th>
              <th className="sortable" onClick={() => toggleSort(SORTABLE.quantity)}>Quantity</th>
              <th className="sortable" onClick={() => toggleSort(SORTABLE.expiry_date)}>Expiry</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((m) => (
              <tr key={m.id}>
                <td><Thumb m={m} /></td>
                <td className="cell-primary">{m.name}</td>
                <td className="cell-muted">{m.generic_name || '—'}</td>
                <td className="mono cell-muted">{m.sku}</td>
                <td>{m.category_name || '—'}</td>
                <td>{m.supplier_name || '—'}</td>
                <td className="mono">{formatCurrency(m.price)}</td>
                <td className="mono">{m.quantity}</td>
                <td className="mono cell-muted">{formatDate(m.nearest_expiry)}</td>
                <td><StatusBadge status={overallStatus(m)} /></td>
                <td>
                  <div className="row-actions">
                    {!isDeletedView && (
                      <Link to={`${basePath}/medicines/${m.id}`} className="btn btn-ghost btn-icon" title="View details">
                        <Eye size={15} />
                      </Link>
                    )}
                    {isAdmin && isDeletedView && (
                      <button
                        className="btn btn-ghost btn-icon"
                        title="Restore"
                        disabled={restoringId === m.id}
                        onClick={() => onRestore(m)}
                      >
                        <RotateCcw size={15} color="var(--primary)" />
                      </button>
                    )}
                    {isAdmin && !isDeletedView && (
                      <>
                        <Link to={`${basePath}/medicines/${m.id}/edit`} className="btn btn-ghost btn-icon" title="Edit">
                          <Pencil size={15} />
                        </Link>
                        <button className="btn btn-ghost btn-icon" title="Delete" onClick={() => onDelete(m)}>
                          <Trash2 size={15} color="var(--status-out-fg)" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="record-cards">
        {medicines.map((m) => (
          <div className="record-card" key={m.id}>
            <div className="record-card-top">
              <Thumb m={m} />
              <div style={{ flex: 1 }}>
                <div className="cell-primary">{m.name}</div>
                <div className="cell-muted mono" style={{ fontSize: 12 }}>{m.sku}</div>
              </div>
              <StatusBadge status={overallStatus(m)} />
            </div>
            <div className="record-card-body">
              <div><span className="k">Category:</span> {m.category_name || '—'}</div>
              <div><span className="k">Supplier:</span> {m.supplier_name || '—'}</div>
              <div><span className="k">Price:</span> {formatCurrency(m.price)}</div>
              <div><span className="k">Qty:</span> {m.quantity}</div>
              <div><span className="k">Expiry:</span> {formatDate(m.nearest_expiry)}</div>
            </div>
            <div className="record-card-actions">
              {!isDeletedView && (
                <Link to={`${basePath}/medicines/${m.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>View</Link>
              )}
              {isAdmin && isDeletedView && (
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} disabled={restoringId === m.id} onClick={() => onRestore(m)}>
                  <RotateCcw size={14} /> Restore
                </button>
              )}
              {isAdmin && !isDeletedView && (
                <>
                  <Link to={`${basePath}/medicines/${m.id}/edit`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Edit</Link>
                  <button className="btn btn-danger btn-sm" onClick={() => onDelete(m)}>Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}