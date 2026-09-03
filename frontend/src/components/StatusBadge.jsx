const CLASS_MAP = {
  'IN STOCK': 'badge-in-stock',
  'LOW STOCK': 'badge-low-stock',
  'OUT OF STOCK': 'badge-out-of-stock',
  'EXPIRING SOON': 'badge-expiring-soon',
  'EXPIRED': 'badge-expired',
};

export default function StatusBadge({ status }) {
  const cls = CLASS_MAP[status] || 'badge-neutral';
  return <span className={`badge ${cls}`}>{status}</span>;
}
