import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };

export default function Toast({ type = 'info', message, onClose }) {
  const Icon = ICONS[type] || Info;
  return (
    <div className={`toast ${type}`} role="status">
      <Icon size={18} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.75 }}
      >
        <X size={15} />
      </button>
    </div>
  );
}
