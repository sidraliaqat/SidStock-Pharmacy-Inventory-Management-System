const { query } = require('../config/db');

const findAll = async (search) => {
  const params = [];
  let where = 'WHERE c.is_deleted = FALSE';
  if (search) {
    where += ' AND c.name ILIKE $1';
    params.push(`%${search}%`);
  }
  const sql = `
    SELECT c.*, COUNT(m.id) FILTER (WHERE m.is_deleted = FALSE) AS medicine_count
    FROM categories c
    LEFT JOIN medicines m ON m.category_id = c.id
    ${where}
    GROUP BY c.id
    ORDER BY c.name ASC
  `;
  const { rows } = await query(sql, params);
  return rows;
};

const findById = async (id) => {
  const { rows } = await query('SELECT * FROM categories WHERE id = $1 AND is_deleted = FALSE', [id]);
  return rows[0] || null;
};

const findByName = async (name, excludeId = null) => {
  const sql = excludeId
    ? 'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2 AND is_deleted = FALSE'
    : 'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND is_deleted = FALSE';
  const params = excludeId ? [name, excludeId] : [name];
  const { rows } = await query(sql, params);
  return rows[0] || null;
};

const create = async ({ name, description }) => {
  const { rows } = await query(
    'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
    [name, description || null]
  );
  return rows[0];
};

const update = async (id, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return findById(id);
  const setClause = keys.map((k, idx) => `${k} = $${idx + 2}`).join(', ');
  const { rows } = await query(
    `UPDATE categories SET ${setClause} WHERE id = $1 AND is_deleted = FALSE RETURNING *`,
    [id, ...keys.map((k) => fields[k])]
  );
  return rows[0] || null;
};

const countMedicines = async (id) => {
  const { rows } = await query(
    'SELECT COUNT(*)::int AS count FROM medicines WHERE category_id = $1 AND is_deleted = FALSE',
    [id]
  );
  return rows[0].count;
};

const softDelete = async (id) => {
  const { rows } = await query(
    'UPDATE categories SET is_deleted = TRUE WHERE id = $1 AND is_deleted = FALSE RETURNING id',
    [id]
  );
  return rows[0] || null;
};

module.exports = { findAll, findById, findByName, create, update, countMedicines, softDelete };
