export default function DashboardCard({ label, value, hint, color, icon: Icon }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color }}>
      <div className="flex-between">
        <span className="stat-label">{label}</span>
        {Icon && <Icon size={16} color={color || 'var(--primary)'} />}
      </div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
