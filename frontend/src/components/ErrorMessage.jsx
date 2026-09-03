import { AlertTriangle } from 'lucide-react';

export default function ErrorMessage({ message = 'Unable to load data. Please try again.', onRetry }) {
  return (
    <div className="state-block">
      <AlertTriangle size={30} className="state-icon" color="#B23327" />
      <h4>Something went wrong</h4>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>Try again</button>
      )}
    </div>
  );
}
