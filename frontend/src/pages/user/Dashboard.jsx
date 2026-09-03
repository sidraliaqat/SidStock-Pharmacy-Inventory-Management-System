import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pill, Boxes, AlertTriangle, CalendarClock } from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import DashboardCard from '../../components/DashboardCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { getErrorMessage } from '../../services/api';

export default function UserDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await dashboardService.user();
      setStats(data.data.stats);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  const cards = [
    { label: 'Total Medicines', value: stats.total_medicines, icon: Pill, color: '#0F6E62' },
    { label: 'Current Stock', value: stats.total_stock_units, icon: Boxes, color: '#1E8E5A', hint: 'Units across all medicines' },
    { label: 'Low Stock', value: stats.low_stock, icon: AlertTriangle, color: '#97620A' },
    { label: 'Expiring Soon', value: stats.expiring_soon, icon: CalendarClock, color: '#A15A15', hint: 'Within 60 days' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">A quick overview of the pharmacy's current stock.</p>
        </div>
        <div className="page-header-actions">
          <Link to="/user/medicines" className="btn btn-primary">View Medicines</Link>
        </div>
      </div>

      <div className="stat-grid">
        {cards.map((c) => <DashboardCard key={c.label} {...c} />)}
      </div>

      <div className="card card-pad">
        <h3 style={{ marginBottom: 10 }}>Quick actions</h3>
        <div className="chip-group">
          <Link to="/user/inventory" className="btn btn-secondary">Record Stock Movement</Link>
          <Link to="/user/inventory-history" className="btn btn-secondary">View Inventory History</Link>
          <Link to="/user/medicines" className="btn btn-secondary">Search Medicines</Link>
        </div>
      </div>
    </>
  );
}
