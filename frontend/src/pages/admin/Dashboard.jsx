import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Pill, Tags, Truck, Boxes, AlertTriangle, XCircle, CalendarX, CalendarClock, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import DashboardCard from '../../components/DashboardCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import { getErrorMessage } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await dashboardService.admin();
      setData(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  const { stats, recentActivity } = data;

  const cards = [
    { label: 'Total Medicines', value: stats.total_medicines, icon: Pill, color: '#0F6E62', hint: 'Active catalog items' },
    { label: 'Categories', value: stats.total_categories, icon: Tags, color: '#5B3DBE', hint: 'Product categories' },
    { label: 'Suppliers', value: stats.total_suppliers, icon: Truck, color: '#C67C3B', hint: 'Active suppliers' },
    { label: 'Stock Units', value: stats.total_stock_units, icon: Boxes, color: '#1E8E5A', hint: 'Units across all medicines' },
    { label: 'Low Stock', value: stats.low_stock, icon: AlertTriangle, color: '#97620A', hint: 'At or below minimum' },
    { label: 'Out of Stock', value: stats.out_of_stock, icon: XCircle, color: '#B23327', hint: 'Zero quantity' },
    { label: 'Expired', value: stats.expired, icon: CalendarX, color: '#8C2A22', hint: 'Past expiry date' },
    { label: 'Expiring Soon', value: stats.expiring_soon, icon: CalendarClock, color: '#A15A15', hint: 'Within 60 days' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="subtitle">Live overview of your pharmacy's inventory.</p>
        </div>
        <div className="page-header-actions">
          <Link to="/admin/medicines/add" className="btn btn-primary">+ Add Medicine</Link>
        </div>
      </div>

      <div className="stat-grid">
        {cards.map((c) => <DashboardCard key={c.label} {...c} />)}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Recent Inventory Activity</h3>
          <Link to="/admin/inventory-history" className="btn btn-ghost btn-sm">View all</Link>
        </div>
        {recentActivity.length === 0 ? (
          <EmptyState title="No inventory activity yet." description="Stock movements will show up here once you start recording them." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine</th><th>Type</th><th>Quantity</th><th>Stock Change</th><th>Reason</th><th>By</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((h) => (
                  <tr key={h.id}>
                    <td className="cell-primary">{h.medicine_name}</td>
                    <td>
                      {h.transaction_type === 'IN'
                        ? <span style={{ color: 'var(--status-in-stock-fg)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><ArrowUpRight size={14} /> IN</span>
                        : <span style={{ color: 'var(--status-out-fg)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><ArrowDownRight size={14} /> OUT</span>}
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
        )}
      </div>
    </>
  );
}
