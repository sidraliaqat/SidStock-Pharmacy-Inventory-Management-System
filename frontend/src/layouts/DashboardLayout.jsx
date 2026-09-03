import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const titleFromPath = (path) => {
  const segment = path.split('/').filter(Boolean)[1] || 'dashboard';
  const map = {
    dashboard: 'Dashboard',
    medicines: 'Medicines',
    categories: 'Categories',
    suppliers: 'Suppliers',
    inventory: 'Inventory',
    'inventory-history': 'Inventory History',
    users: 'Users',
    reports: 'Reports',
    profile: 'My Profile',
  };
  return map[segment] || 'SidStock';
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div>
        <Navbar title={titleFromPath(location.pathname)} onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
