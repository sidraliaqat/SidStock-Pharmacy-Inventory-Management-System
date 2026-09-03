import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import categoryService from '../../services/categoryService';
import SearchBar from '../../components/SearchBar';
import Modal from '../../components/Modal';
import CategoryForm from '../../components/CategoryForm';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage, getErrorList } from '../../services/api';
import { formatDate } from '../../utils/formatters';

export default function Categories() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit'
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await categoryService.list(search);
      setCategories(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setModalMode('add'); setEditing(null); setServerErrors([]); };
  const openEdit = (c) => { setModalMode('edit'); setEditing(c); setServerErrors([]); };
  const closeModal = () => { setModalMode(null); setEditing(null); };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setServerErrors([]);
    try {
      if (modalMode === 'add') {
        await categoryService.create(payload);
        toast.success('Category created successfully.');
      } else {
        await categoryService.update(editing.id, payload);
        toast.success('Category updated successfully.');
      }
      closeModal();
      load();
    } catch (err) {
      setServerErrors(getErrorList(err) || [getErrorMessage(err)]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await categoryService.remove(deleteTarget.id);
      toast.success('Category deleted successfully.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p className="subtitle">Organize medicines into categories.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Category</button>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search categories..." />
        </div>

        {loading ? <LoadingSpinner inline label="Loading categories..." />
          : error ? <ErrorMessage message={error} onRetry={load} />
          : categories.length === 0 ? <EmptyState title="No categories found." description="Add a category to start organizing your medicines." />
          : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Description</th><th># Medicines</th><th>Created</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td className="cell-primary">{c.name}</td>
                      <td className="cell-muted">{c.description || '—'}</td>
                      <td className="mono">{c.medicine_count}</td>
                      <td className="cell-muted">{formatDate(c.created_at)}</td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => openEdit(c)}><Pencil size={15} /></button>
                          <button className="btn btn-ghost btn-icon" title="Delete" onClick={() => setDeleteTarget(c)}>
                            <Trash2 size={15} color="var(--status-out-fg)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {modalMode && (
        <Modal title={modalMode === 'add' ? 'Add Category' : 'Edit Category'} onClose={closeModal}>
          <CategoryForm
            initialData={editing}
            onSubmit={handleSubmit}
            onCancel={closeModal}
            submitting={submitting}
            serverErrors={serverErrors}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Category"
          message={`Are you sure you want to delete "${deleteTarget.name}"? Categories with medicines cannot be deleted.`}
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
