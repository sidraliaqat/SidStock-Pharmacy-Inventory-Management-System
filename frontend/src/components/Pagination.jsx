import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZES = [10, 20, 50, 100];

/**
 * Builds a compact page list like: 1 … 4 5 [6] 7 8 … 20
 */
const buildPageList = (current, total) => {
  const pages = [];
  const add = (p) => { if (!pages.includes(p)) pages.push(p); };
  add(1);
  for (let p = current - 1; p <= current + 1; p += 1) {
    if (p > 1 && p < total) add(p);
  }
  add(total);
  const withGaps = [];
  let prev = 0;
  for (const p of pages.sort((a, b) => a - b)) {
    if (prev && p - prev > 1) withGaps.push('...');
    withGaps.push(p);
    prev = p;
  }
  return withGaps;
};

export default function Pagination({ page, limit, total, totalPages, onPageChange, onLimitChange }) {
  if (total === 0) return null;
  const pages = buildPageList(page, totalPages);
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="pagination">
      <div className="pagination-meta">
        Showing <strong>{start}</strong>–<strong>{end}</strong> of <strong>{total}</strong>
      </div>
      <div className="pagination-controls">
        <button className="pagination-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft size={15} />
        </button>
        {pages.map((p, idx) => p === '...' ? (
          <span key={`gap-${idx}`} style={{ padding: '0 4px', color: 'var(--text-faint)' }}>…</span>
        ) : (
          <button
            key={p}
            className={`pagination-btn ${p === page ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button className="pagination-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight size={15} />
        </button>
      </div>
      {onLimitChange && (
        <select className="page-size-select" value={limit} onChange={(e) => onLimitChange(Number(e.target.value))}>
          {PAGE_SIZES.map((size) => <option key={size} value={size}>{size} / page</option>)}
        </select>
      )}
    </div>
  );
}
