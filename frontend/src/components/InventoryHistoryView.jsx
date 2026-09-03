import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import inventoryService from '../services/inventoryService';
import medicineService from '../services/medicineService';
import userService from '../services/userService';
import Pagination from './Pagination';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import EmptyState from './EmptyState';
import { getErrorMessage } from '../services/api';
import { formatDateTime } from '../utils/formatters';

const DEFAULT_FILTERS = { medicine: '', type: '', user: '', from: '', to: '', page: 1, limit: 20 };

export default function InventoryHistoryView({ isAdmin }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [medQuery, setMedQuery] = useState('');
  const [medResults, setMedResults] = useState([]);
  const [medicineLabel, setMedicineLabel] = useState('');
  const [users, setUsers] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const { data } = await inventoryService.history(params);
      setRows(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (isAdmin) userService.list().then(({ data }) => setUsers(data.data)).catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    if (!medQuery.trim()) { setMedResults([]); return; }
    const handle = setTimeout(async () => {
      const { data } = await medicineService.list({ search: medQuery, limit: 6 });
      setMedResults(data.data);
    }, 300);
    return () => clearTimeout(handle);
  }, [medQuery]);

  const update = (patch) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Inventory History</h1>
          <p className="subtitle">Every stock movement, with who made it and when.</p>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar" style={{ flexWrap: 'wrap' }}>
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input
              placeholder="Filter by medicine..."
              value={medicineLabel || medQuery}
              onChange={(e) => { setMedQuery(e.target.value); setMedicineLabel(''); if (!e.target.value) update({ medicine: '' }); }}
            />
            {medResults.length > 0 && (
              <div className="card" style={{ position: 'absolute', zIndex: 10, width: '100%', marginTop: 4 }}>
                {medResults.map((m) => (
                  <div
                    key={m.id}
                    style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13 }}
                    onClick={() => { update({ medicine: m.id }); setMedicineLabel(m.name); setMedResults([]); setMedQuery(''); }}
                  >
                    {m.name} <span className="cell-muted mono" style={{ fontSize: 11 }}>({m.sku})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <select className="filter-select" value={filters.type} onChange={(e) => update({ type: e.target.value })}>
            <option value="">All types</option>
            <option value="IN">Stock IN</option>
            <option value="OUT">Stock OUT</option>
          </select>

          {isAdmin && (
            <select className="filter-select" value={filters.user} onChange={(e) => update({ user: e.target.value })}>
              <option value="">All users</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}

          <div className="filter-price-range">
            <input type="date" value={filters.from} onChange={(e) => update({ from: e.target.value })} />
            <span style={{ color: 'var(--text-faint)' }}>–</span>
            <input type="date" value={filters.to} onChange={(e) => update({ to: e.target.value })} />
          </div>

          {(filters.medicine || filters.type || filters.user || filters.from || filters.to) && (
            <span className="filter-clear" onClick={() => { setFilters(DEFAULT_FILTERS); setMedicineLabel(''); setMedQuery(''); }}>
              Clear filters
            </span>
          )}
        </div>

        {loading ? <LoadingSpinner inline label="Loading history..." />
          : error ? <ErrorMessage message={error} onRetry={load} />
          : rows.length === 0 ? <EmptyState title="No inventory history found." description="Try adjusting your filters." />
          : (
            <>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Medicine</th><th>Type</th><th>Quantity</th><th>Previous → New</th><th>Reason</th><th>Performed By</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((h) => (
                      <tr key={h.id}>
                        <td className="cell-primary">{h.medicine_name} <span className="cell-muted mono" style={{ fontSize: 11 }}>({h.sku})</span></td>
                        <td>
                          <span className={`badge ${h.transaction_type === 'IN' ? 'badge-in-stock' : 'badge-out-of-stock'}`}>{h.transaction_type}</span>
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
              <Pagination {...pagination} onPageChange={(p) => update({ page: p })} onLimitChange={(l) => update({ limit: l, page: 1 })} />
            </>
          )}
      </div>
    </>
  );
}
