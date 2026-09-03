const { query } = require('../config/db');

const insertHistory = async (client, entry) => {
  const {
    medicine_id, user_id, transaction_type, quantity,
    previous_quantity, new_quantity, reason,
  } = entry;
  const { rows } = await client.query(
    `INSERT INTO inventory_history
       (medicine_id, user_id, transaction_type, quantity, previous_quantity, new_quantity, reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [medicine_id, user_id, transaction_type, quantity, previous_quantity, new_quantity, reason || null]
  );
  return rows[0];
};

const findAndCount = async (filters) => {
  const clauses = [];
  const params = [];
  let i = 1;

  if (filters.medicine) {
    clauses.push(`h.medicine_id = $${i}`);
    params.push(filters.medicine);
    i += 1;
  }
  if (filters.type) {
    clauses.push(`h.transaction_type = $${i}`);
    params.push(filters.type);
    i += 1;
  }
  if (filters.user) {
    clauses.push(`h.user_id = $${i}`);
    params.push(filters.user);
    i += 1;
  }
  if (filters.from) {
    clauses.push(`h.created_at >= $${i}`);
    params.push(filters.from);
    i += 1;
  }
  if (filters.to) {
    clauses.push(`h.created_at <= $${i}`);
    params.push(filters.to);
    i += 1;
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const offset = (filters.page - 1) * filters.limit;

  const sql = `
    SELECT
      h.id, h.medicine_id, m.name AS medicine_name, m.sku,
      h.user_id, u.name AS user_name,
      h.transaction_type, h.quantity, h.previous_quantity, h.new_quantity,
      h.reason, h.created_at,
      COUNT(*) OVER() ::int AS total_count
    FROM inventory_history h
    JOIN medicines m ON m.id = h.medicine_id
    LEFT JOIN users u ON u.id = h.user_id
    ${whereSql}
    ORDER BY h.created_at DESC
    LIMIT $${i} OFFSET $${i + 1}
  `;
  const { rows } = await query(sql, [...params, filters.limit, offset]);
  const total = rows[0]?.total_count || 0;
  return { rows: rows.map(({ total_count, ...r }) => r), total };
};

module.exports = { insertHistory, findAndCount };
