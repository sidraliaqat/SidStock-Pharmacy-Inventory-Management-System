const STOCK_OPTIONS = [
  { value: '', label: 'All stock levels' },
  { value: 'in-stock', label: 'In stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
];

const EXPIRY_OPTIONS = [
  { value: '', label: 'All expiry' },
  { value: 'ok', label: 'OK' },
  { value: 'expiring-soon', label: 'Expiring soon' },
  { value: 'expired', label: 'Expired' },
];

export default function FilterPanel({ filters, onChange, categories = [], suppliers = [] }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  const hasActiveFilters = filters.category || filters.supplier || filters.stockStatus ||
    filters.expiryStatus || filters.minPrice || filters.maxPrice;

  const clearAll = () => onChange({
    category: '', supplier: '', stockStatus: '', expiryStatus: '', minPrice: '', maxPrice: '',
  });

  return (
    <div className="filter-panel">
      <select className="filter-select" value={filters.category || ''} onChange={(e) => set('category', e.target.value)}>
        <option value="">All categories</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <select className="filter-select" value={filters.supplier || ''} onChange={(e) => set('supplier', e.target.value)}>
        <option value="">All suppliers</option>
        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      <select className="filter-select" value={filters.stockStatus || ''} onChange={(e) => set('stockStatus', e.target.value)}>
        {STOCK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select className="filter-select" value={filters.expiryStatus || ''} onChange={(e) => set('expiryStatus', e.target.value)}>
        {EXPIRY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <div className="filter-price-range">
        <input
          type="number" min="0" placeholder="Min ₨"
          value={filters.minPrice || ''} onChange={(e) => set('minPrice', e.target.value)}
        />
        <span style={{ color: 'var(--text-faint)' }}>–</span>
        <input
          type="number" min="0" placeholder="Max ₨"
          value={filters.maxPrice || ''} onChange={(e) => set('maxPrice', e.target.value)}
        />
      </div>

      {hasActiveFilters && (
        <span className="filter-clear" onClick={clearAll}>Clear filters</span>
      )}
    </div>
  );
}
