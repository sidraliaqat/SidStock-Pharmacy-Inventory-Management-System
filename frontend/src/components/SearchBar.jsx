import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Debounced search input so we don't hammer the API on every keystroke. */
export default function SearchBar({ value, onChange, placeholder = 'Search medicines...', delay = 400 }) {
  const [local, setLocal] = useState(value || '');

  useEffect(() => setLocal(value || ''), [value]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (local !== value) onChange(local);
    }, delay);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <div className="search-bar">
      <Search size={15} className="search-icon" />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
      />
    </div>
  );
}
