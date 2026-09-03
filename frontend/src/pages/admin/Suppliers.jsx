import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import supplierService from '../../services/supplierService';
import SearchBar from '../../components/SearchBar';
import Modal from '../../components/Modal';
import SupplierForm from '../../components/SupplierForm';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage, getErrorList } from '../../services/api';

export default function Suppliers() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await supplierService.list(search);
      setSuppliers(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setModalMode('add'); setEditing(null); setServerErrors([]); };
  const openEdit = (s) => { setModalMode('edit'); setEditing(s); setServerErrors([]); };
  const closeModal = () => { setModalMode(null); setEditing(null); };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setServerErrors([]);
    try {
      if (modalMode === 'add') {
        await supplierService.create(payload);
        toast.success('Supplier created successfully.');
      } else {
        await supplierService.update(editing.id, payload);
        toast.success('Supplier updated successfully.');
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
      await supplierService.remove(deleteTarget.id);
      toast.success('Supplier deleted successfully.');
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
          <h1>Suppliers</h1>
          <p className="subtitle">Manage the pharmacy's supplier network.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Supplier</button>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search suppliers..." />
        </div>

        {loading ? <LoadingSpinner inline label="Loading suppliers..." />
          : error ? <ErrorMessage message={error} onRetry={load} />
          : suppliers.length === 0 ? <EmptyState title="No suppliers found." description="Add a supplier to start sourcing medicines." />
          : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Contact</th><th>Address</th><th># Medicines</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td className="cell-primary">{s.name}</td>
                      <td className="cell-muted">
                        {s.email && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={12} />{s.email}</div>}
                        {s.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}><Phone size={12} />{s.phone}</div>}
                        {!s.email && !s.phone && '—'}
                      </td>
                      <td className="cell-muted">{s.address || '—'}</td>
                      <td className="mono">{s.medicine_count}</td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => openEdit(s)}><Pencil size={15} /></button>
                          <button className="btn btn-ghost btn-icon" title="Delete" onClick={() => setDeleteTarget(s)}>
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
        <Modal title={modalMode === 'add' ? 'Add Supplier' : 'Edit Supplier'} onClose={closeModal}>
          <SupplierForm
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
          title="Delete Supplier"
          message={`Are you sure you want to delete "${deleteTarget.name}"? Suppliers with medicines cannot be deleted.`}
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
