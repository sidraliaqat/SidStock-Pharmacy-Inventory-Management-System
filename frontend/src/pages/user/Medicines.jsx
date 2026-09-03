import { useCallback, useEffect, useState } from 'react';
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
import { getErrorMessage } from '../../services/api';

const DEFAULT_FILTERS = {
  search: '', category: '', supplier: '', stockStatus: '', expiryStatus: '', minPrice: '', maxPrice: '',
  sort: '-created_at', page: 1, limit: 20,
};

export default function UserMedicines() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [medicines, setMedicines] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Medicines</h1>
          <p className="subtitle">{pagination.total} medicine{pagination.total === 1 ? '' : 's'} available.</p>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <SearchBar value={filters.search} onChange={(v) => updateFilters({ search: v })} />
          <FilterPanel filters={filters} onChange={(patch) => updateFilters(patch)} categories={categories} suppliers={suppliers} />
          <SortDropdown value={filters.sort} onChange={(v) => updateFilters({ sort: v })} />
        </div>

        {loading ? <LoadingSpinner inline label="Loading medicines..." />
          : error ? <ErrorMessage message={error} onRetry={load} />
          : medicines.length === 0 ? <EmptyState title="No medicines found." description="Try adjusting your search or filters." />
          : (
            <>
              <MedicineTable
                medicines={medicines}
                basePath="/user"
                isAdmin={false}
                sort={filters.sort}
                onSortChange={(s) => updateFilters({ sort: s })}
              />
              <Pagination {...pagination} onPageChange={(p) => updateFilters({ page: p })} onLimitChange={(l) => updateFilters({ limit: l, page: 1 })} />
            </>
          )}
      </div>
    </>
  );
}
