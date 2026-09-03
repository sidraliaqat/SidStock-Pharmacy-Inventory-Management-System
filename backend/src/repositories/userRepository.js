const { query } = require('../config/db');

const PUBLIC_COLUMNS = 'id, name, email, role, is_active, created_at, updated_at';

const findById = async (id) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
};

const findByEmail = async (email) => {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
};

const create = async ({ name, email, passwordHash, role }) => {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4) RETURNING ${PUBLIC_COLUMNS}`,
    [name, email, passwordHash, role]
  );
  return rows[0];
};

const findAll = async () => {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS} FROM users ORDER BY created_at DESC`
  );
  return rows;
};

const update = async (id, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return findById(id);
  const setClause = keys.map((key, idx) => `${key} = $${idx + 2}`).join(', ');
  const values = keys.map((k) => fields[k]);
  const { rows } = await query(
    `UPDATE users SET ${setClause} WHERE id = $1 RETURNING ${PUBLIC_COLUMNS}`,
    [id, ...values]
  );
  return rows[0] || null;
};

const remove = async (id) => {
  const { rows } = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  return rows[0] || null;
};

module.exports = { findById, findByEmail, create, findAll, update, remove, PUBLIC_COLUMNS };
