import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import medicineService from '../../services/medicineService';
import categoryService from '../../services/categoryService';
import supplierService from '../../services/supplierService';
import MedicineForm from '../../components/MedicineForm';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage, getErrorList } from '../../services/api';

export default function EditMedicine() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [medicine, setMedicine] = useState(null);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [medRes, catRes, supRes] = await Promise.all([
        medicineService.getById(id),
        categoryService.list(),
        supplierService.list(),
      ]);
      setMedicine(medRes.data.data);
      setCategories(catRes.data.data);
      setSuppliers(supRes.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setServerErrors([]);
    try {
      await medicineService.update(id, formData);
      toast.success('Medicine updated successfully.');
      navigate(`/admin/medicines/${id}`);
    } catch (err) {
      setServerErrors(getErrorList(err) || [getErrorMessage(err)]);
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading medicine..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <>
      <Link to={`/admin/medicines/${id}`} className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>
        <ChevronLeft size={15} /> Back to Details
      </Link>
      <div className="page-header">
        <div>
          <h1>Edit Medicine</h1>
          <p className="subtitle">Update details for {medicine.name}.</p>
        </div>
      </div>
      <div className="card card-pad">
        <MedicineForm
          mode="edit"
          initialData={medicine}
          categories={categories}
          suppliers={suppliers}
          onSubmit={handleSubmit}
          submitting={submitting}
          serverErrors={serverErrors}
        />
      </div>
    </>
  );
}
