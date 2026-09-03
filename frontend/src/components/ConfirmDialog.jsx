import { AlertTriangle, HelpCircle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} onClose={onCancel} size="sm" footer={
      <>
        <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        <button
          className={danger ? 'btn btn-danger-solid' : 'btn btn-primary'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Please wait…' : confirmLabel}
        </button>
      </>
    }>
      <div className={`confirm-icon ${danger ? 'danger' : 'warn'}`}>
        {danger ? <AlertTriangle size={22} /> : <HelpCircle size={22} />}
      </div>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}
