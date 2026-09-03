import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import ProtectedRoute from './routes/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';

import AdminDashboard from './pages/admin/Dashboard';
import AdminMedicines from './pages/admin/Medicines';
import AddMedicine from './pages/admin/AddMedicine';
import EditMedicine from './pages/admin/EditMedicine';
import AdminMedicineDetails from './pages/admin/MedicineDetails';
import Categories from './pages/admin/Categories';
import Suppliers from './pages/admin/Suppliers';
import AdminInventory from './pages/admin/Inventory';
import AdminInventoryHistory from './pages/admin/InventoryHistory';
import Users from './pages/admin/Users';
import Reports from './pages/admin/Reports';
import AdminProfile from './pages/admin/Profile';

import UserDashboard from './pages/user/Dashboard';
import UserMedicines from './pages/user/Medicines';
import UserMedicineDetails from './pages/user/MedicineDetails';
import UserInventory from './pages/user/Inventory';
import UserInventoryHistory from './pages/user/InventoryHistory';
import UserProfile from './pages/user/Profile';

function RootRedirect() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? '/admin/dashboard' : '/user/dashboard'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="medicines" element={<AdminMedicines />} />
          <Route path="medicines/add" element={<AddMedicine />} />
          <Route path="medicines/:id" element={<AdminMedicineDetails />} />
          <Route path="medicines/:id/edit" element={<EditMedicine />} />
          <Route path="categories" element={<Categories />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="inventory-history" element={<AdminInventoryHistory />} />
          <Route path="users" element={<Users />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} />}>
        <Route path="/user" element={<UserLayout />}>
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="medicines" element={<UserMedicines />} />
          <Route path="medicines/:id" element={<UserMedicineDetails />} />
          <Route path="inventory" element={<UserInventory />} />
          <Route path="inventory-history" element={<UserInventoryHistory />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
