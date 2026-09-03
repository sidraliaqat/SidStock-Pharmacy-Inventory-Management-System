import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import medicineService from '../../services/medicineService';
import categoryService from '../../services/categoryService';
import supplierService from '../../services/supplierService';
import MedicineTable from '../../components/MedicineTable';
import SearchBar from '../../components/SearchBar';
import FilterPanel from '../../components/FilterPanel';
import SortDropdown from '../../components/SortDropdown';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';

const DEFAULT_FILTERS = {
  search: '', category: '', supplier: '', stockStatus: '', expiryStatus: '', minPrice: '', maxPrice: '',
  showDeleted: false, sort: '-created_at', page: 1, limit: 20,
};

export default function AdminMedicines() {
  const toast = useToast();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [medicines, setMedicines] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== null));
      const { data: res } = await medicineService.list(params);
      setMedicines(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    categoryService.list().then(({ data }) => setCategories(data.data)).catch(() => {});
    supplierService.list().then(({ data }) => setSuppliers(data.data)).catch(() => {});
  }, []);

  const updateFilters = (patch) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await medicineService.remove(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" was deleted successfully.`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (medicine) => {
    setRestoringId(medicine.id);
    try {
      await medicineService.restore(medicine.id);
      toast.success(`"${medicine.name}" was restored successfully.`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRestoringId(null);
    }
  };

  const handleExport = async () => {
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([k, v]) => v !== '' && v !== null && k !== 'page' && k !== 'limit'));
      await medicineService.exportCsv(params);
      toast.success('CSV export downloaded.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Medicines</h1>
          <p className="subtitle">{pagination.total} medicine{pagination.total === 1 ? '' : 's'} in your catalog.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={handleExport}><Download size={15} /> Export CSV</button>
          <Link to="/admin/medicines/add" className="btn btn-primary"><Plus size={15} /> Add Medicine</Link>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <SearchBar value={filters.search} onChange={(v) => updateFilters({ search: v })} />
          <FilterPanel filters={filters} onChange={(patch) => updateFilters(patch)} categories={categories} suppliers={suppliers} />
          <SortDropdown value={filters.sort} onChange={(v) => updateFilters({ sort: v })} />
          <label className="stack-8" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filters.showDeleted}
              onChange={(e) => updateFilters({ showDeleted: e.target.checked })}
            />
            Show Deleted
          </label>
        </div>

        {loading ? (
          <LoadingSpinner inline label="Loading medicines..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : medicines.length === 0 ? (
          <EmptyState title="No medicines found." description="Try adjusting your search or filters, or add a new medicine." />
        ) : (
          <>
            <MedicineTable
              medicines={medicines}
              basePath="/admin"
              isAdmin
              sort={filters.sort}
              onSortChange={(s) => updateFilters({ sort: s })}
              onDelete={setDeleteTarget}
              isDeletedView={filters.showDeleted}
              onRestore={handleRestore}
              restoringId={restoringId}
            />
            <Pagination
              {...pagination}
              onPageChange={(p) => updateFilters({ page: p })}
              onLimitChange={(l) => updateFilters({ limit: l, page: 1 })}
            />
          </>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Medicine"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}