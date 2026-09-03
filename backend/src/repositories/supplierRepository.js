const { query } = require('../config/db');

const findAll = async (search) => {
  const params = [];
  let where = 'WHERE s.is_deleted = FALSE';
  if (search) {
    where += ' AND (s.name ILIKE $1 OR s.email ILIKE $1)';
    params.push(`%${search}%`);
  }
  const sql = `
    SELECT s.*, COUNT(m.id) FILTER (WHERE m.is_deleted = FALSE) AS medicine_count
    FROM suppliers s
    LEFT JOIN medicines m ON m.supplier_id = s.id
    ${where}
    GROUP BY s.id
    ORDER BY s.name ASC
  `;
  const { rows } = await query(sql, params);
  return rows;
};

const findById = async (id) => {
  const { rows } = await query('SELECT * FROM suppliers WHERE id = $1 AND is_deleted = FALSE', [id]);
  return rows[0] || null;
};

const create = async ({ name, email, phone, address }) => {
  const { rows } = await query(
    'INSERT INTO suppliers (name, email, phone, address) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, email || null, phone || null, address || null]
  );
  return rows[0];
};

const update = async (id, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return findById(id);
  const setClause = keys.map((k, idx) => `${k} = $${idx + 2}`).join(', ');
  const { rows } = await query(
    `UPDATE suppliers SET ${setClause} WHERE id = $1 AND is_deleted = FALSE RETURNING *`,
    [id, ...keys.map((k) => fields[k])]
  );
  return rows[0] || null;
};

const countMedicines = async (id) => {
  const { rows } = await query(
    'SELECT COUNT(*)::int AS count FROM medicines WHERE supplier_id = $1 AND is_deleted = FALSE',
    [id]
  );
  return rows[0].count;
};

const softDelete = async (id) => {
  const { rows } = await query(
    'UPDATE suppliers SET is_deleted = TRUE WHERE id = $1 AND is_deleted = FALSE RETURNING id',
    [id]
  );
  return rows[0] || null;
};

module.exports = { findAll, findById, create, update, countMedicines, softDelete };
