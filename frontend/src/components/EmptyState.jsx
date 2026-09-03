import { PackageSearch } from 'lucide-react';

export default function EmptyState({ title = 'No records found.', description, icon: Icon = PackageSearch, action }) {
  return (
    <div className="state-block">
      <Icon size={34} className="state-icon" />
      <h4>{title}</h4>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
