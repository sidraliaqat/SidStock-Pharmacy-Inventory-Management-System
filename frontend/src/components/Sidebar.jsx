import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Pill, Tags, Truck, PackagePlus, History,
  Users, FileBarChart, UserCircle, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/medicines', label: 'Medicines', icon: Pill },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/admin/inventory', label: 'Inventory', icon: PackagePlus },
  { to: '/admin/inventory-history', label: 'Inventory History', icon: History },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
];

const USER_LINKS = [
  { to: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/user/medicines', label: 'Medicines', icon: Pill },
  { to: '/user/inventory', label: 'Inventory', icon: PackagePlus },
  { to: '/user/inventory-history', label: 'Inventory History', icon: History },
];

export default function Sidebar({ open, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const links = isAdmin ? ADMIN_LINKS : USER_LINKS;
  const profilePath = isAdmin ? '/admin/profile' : '/user/profile';

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">SS</div>
          <div>
            <div className="brand-text">SidStock</div>
            <div className="brand-sub">Pharmacy Inventory</div>
          </div>
        </div>

        <div className="sidebar-section-label">Menu</div>
        <ul>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
                end
              >
                <link.icon className="icon" size={17} />
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <NavLink
            to={profilePath}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <UserCircle className="icon" size={17} />
            Profile
          </NavLink>
          <button
            className="sidebar-link"
            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={logout}
          >
            <LogOut className="icon" size={17} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
