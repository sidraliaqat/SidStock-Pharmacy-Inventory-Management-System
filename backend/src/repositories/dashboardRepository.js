const { query } = require('../config/db');
const { EXPIRING_SOON_DAYS } = require('../constants');

/**
 * Single round-trip aggregate query for the core stats cards.
 * All numbers come straight from PostgreSQL — nothing is hardcoded.
 */
const getSummaryStats = async () => {
  const sql = `
    WITH nearest AS (
      SELECT m.id, m.quantity, m.minimum_stock,
        (SELECT MIN(mb.expiry_date) FROM medicine_batches mb WHERE mb.medicine_id = m.id) AS nearest_expiry
      FROM medicines m
      WHERE m.is_deleted = FALSE
    )
    SELECT
      (SELECT COUNT(*) FROM nearest)::int AS total_medicines,
      (SELECT COUNT(*) FROM categories WHERE is_deleted = FALSE)::int AS total_categories,
      (SELECT COUNT(*) FROM suppliers WHERE is_deleted = FALSE)::int AS total_suppliers,
      (SELECT COALESCE(SUM(quantity), 0) FROM nearest)::int AS total_stock_units,
      (SELECT COUNT(*) FROM nearest WHERE quantity > 0 AND quantity <= minimum_stock)::int AS low_stock,
      (SELECT COUNT(*) FROM nearest WHERE quantity = 0)::int AS out_of_stock,
      (SELECT COUNT(*) FROM nearest WHERE nearest_expiry IS NOT NULL AND nearest_expiry < CURRENT_DATE)::int AS expired,
      (SELECT COUNT(*) FROM nearest WHERE nearest_expiry IS NOT NULL AND nearest_expiry >= CURRENT_DATE AND nearest_expiry <= CURRENT_DATE + ${EXPIRING_SOON_DAYS})::int AS expiring_soon
  `;
  const { rows } = await query(sql);
  return rows[0];
};

const getRecentActivity = async (limit = 8) => {
  const { rows } = await query(
    `SELECT h.id, m.name AS medicine_name, h.transaction_type, h.quantity,
            h.previous_quantity, h.new_quantity, h.reason, h.created_at,
            u.name AS user_name
     FROM inventory_history h
     JOIN medicines m ON m.id = h.medicine_id
     LEFT JOIN users u ON u.id = h.user_id
     ORDER BY h.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
};

module.exports = { getSummaryStats, getRecentActivity };
