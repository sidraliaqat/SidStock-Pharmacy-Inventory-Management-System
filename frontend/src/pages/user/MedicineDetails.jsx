import MedicineDetailView from '../../components/MedicineDetailView';

export default function UserMedicineDetails() {
  return <MedicineDetailView basePath="/user" isAdmin={false} />;
}
