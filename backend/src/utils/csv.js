/**
 * Minimal, dependency-free CSV writer. Escapes values per RFC 4180
 * (wraps in quotes and doubles internal quotes whenever a value contains
 * a comma, quote, or newline).
 */
const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const toCsv = (columns, rows) => {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvValue(row[c.key])).join(',')
  );
  return [header, ...lines].join('\n');
};

module.exports = { toCsv };
