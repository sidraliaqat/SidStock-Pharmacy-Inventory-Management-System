export default function LoadingSpinner({ label = 'Loading...', inline = false, large = false }) {
  if (inline) {
    return (
      <div className="inline-loading">
        <span className={`spinner ${large ? 'spinner-lg' : ''}`} />
        <span>{label}</span>
      </div>
    );
  }
  return (
    <div className="state-block">
      <span className="spinner spinner-lg" />
      <p>{label}</p>
    </div>
  );
}
