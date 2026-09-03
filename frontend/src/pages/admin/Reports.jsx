import { useEffect, useState } from 'react';
import { Download, AlertTriangle, XCircle, CalendarX, CalendarClock } from 'lucide-react';
import medicineService from '../../services/medicineService';
import MedicineCard from '../../components/MedicineCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';

const TABS = [
  { key: 'low', label: 'Low Stock', icon: AlertTriangle },
  { key: 'out', label: 'Out of Stock', icon: XCircle },
  { key: 'expired', label: 'Expired', icon: CalendarX },
  { key: 'expiring', label: 'Expiring Soon', icon: CalendarClock },
];

export default function Reports() {
  const toast = useToast();
  const [active, setActive] = useState('low');
  const [data, setData] = useState({ low: null, out: null, expired: null, expiring: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [low, out, expired, expiring] = await Promise.all([
        medicineService.lowStock(),
        medicineService.outOfStock(),
        medicineService.expired(),
        medicineService.expiringSoon(),
      ]);
      setData({
        low: low.data.data, out: out.data.data,
        expired: expired.data.data, expiring: expiring.data.data,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleExport = async (statusFilter) => {
    try {
      const paramsMap = {
        low: { stockStatus: 'low' }, out: { stockStatus: 'out' },
        expired: { expiryStatus: 'expired' }, expiring: { expiryStatus: 'expiring-soon' },
      };
      await medicineService.exportCsv(paramsMap[statusFilter]);
      toast.success('Report exported as CSV.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <LoadingSpinner label="Building reports..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadAll} />;

  const activeList = data[active] || [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="subtitle">Stock and expiry monitoring across your catalog.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => handleExport(active)}><Download size={15} /> Export This View</button>
        </div>
      </div>

      <div className="stat-grid">
        {TABS.map((t) => (
          <div
            key={t.key}
            className="stat-card"
            style={{ '--stat-color': 'var(--primary)', cursor: 'pointer', outline: active === t.key ? '2px solid var(--primary)' : 'none' }}
            onClick={() => setActive(t.key)}
          >
            <div className="flex-between">
              <span className="stat-label">{t.label}</span>
              <t.icon size={16} />
            </div>
            <div className="stat-value">{data[t.key]?.length ?? 0}</div>
          </div>
        ))}
      </div>

      <div className="card card-pad">
        <h3 style={{ marginBottom: 16 }}>{TABS.find((t) => t.key === active)?.label} Medicines</h3>
        {activeList.length === 0 ? (
          <EmptyState title="Nothing to report here." description="Great — no medicines currently fall into this category." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {activeList.map((m) => (
              <MedicineCard key={m.id} medicine={m} basePath="/admin" statusOverride={
                active === 'expired' ? 'EXPIRED' : active === 'expiring' ? 'EXPIRING SOON' : undefined
              } />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
