export default function RoleBadge({ role }) {
  return (
    <span className={`badge ${role === 'admin' ? 'badge-role-admin' : 'badge-role-staff'}`}>
      {role}
    </span>
  );
}
