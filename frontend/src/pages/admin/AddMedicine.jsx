import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import medicineService from '../../services/medicineService';
import categoryService from '../../services/categoryService';
import supplierService from '../../services/supplierService';
import MedicineForm from '../../components/MedicineForm';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage, getErrorList } from '../../services/api';

export default function AddMedicine() {
  const navigate = useNavigate();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);

  useEffect(() => {
    categoryService.list().then(({ data }) => setCategories(data.data)).catch(() => {});
    supplierService.list().then(({ data }) => setSuppliers(data.data)).catch(() => {});
  }, []);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setServerErrors([]);
    try {
      const { data } = await medicineService.create(formData);
      toast.success('Medicine added successfully.');
      navigate(`/admin/medicines/${data.data.id}`);
    } catch (err) {
      setServerErrors(getErrorList(err) || [getErrorMessage(err)]);
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Link to="/admin/medicines" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>
        <ChevronLeft size={15} /> Back to Medicines
      </Link>
      <div className="page-header">
        <div>
          <h1>Add Medicine</h1>
          <p className="subtitle">Add a new medicine to your pharmacy's catalog.</p>
        </div>
      </div>
      <div className="card card-pad">
        {categories.length === 0 && (
          <div className="auth-error" style={{ marginBottom: 16 }}>
            You need at least one category and supplier before adding a medicine.{' '}
            <Link to="/admin/categories">Manage categories</Link> · <Link to="/admin/suppliers">Manage suppliers</Link>
          </div>
        )}
        <MedicineForm
          mode="create"
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
