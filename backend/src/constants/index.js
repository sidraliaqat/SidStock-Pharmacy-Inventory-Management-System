const ROLES = Object.freeze({
  ADMIN: 'admin',
  STAFF: 'staff',
});

const STOCK_STATUS = Object.freeze({
  IN_STOCK: 'IN STOCK',
  LOW_STOCK: 'LOW STOCK',
  OUT_OF_STOCK: 'OUT OF STOCK',
});

const EXPIRY_STATUS = Object.freeze({
  OK: 'OK',
  EXPIRING_SOON: 'EXPIRING SOON',
  EXPIRED: 'EXPIRED',
});

const EXPIRING_SOON_DAYS = 60;

const TRANSACTION_TYPES = Object.freeze({
  IN: 'IN',
  OUT: 'OUT',
});

// Whitelisted sortable columns -> real SQL column, to prevent SQL injection
// via the `sort` query parameter.
const MEDICINE_SORT_FIELDS = Object.freeze({
  name: 'm.name',
  price: 'm.price',
  quantity: 'm.quantity',
  created_at: 'm.created_at',
  expiry_date: 'nearest_expiry',
});

module.exports = {
  ROLES,
  STOCK_STATUS,
  EXPIRY_STATUS,
  EXPIRING_SOON_DAYS,
  TRANSACTION_TYPES,
  MEDICINE_SORT_FIELDS,
};
