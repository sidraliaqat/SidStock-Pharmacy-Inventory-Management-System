const { query, withTransaction } = require('../config/db');
const { MEDICINE_SORT_FIELDS, EXPIRING_SOON_DAYS } = require('../constants');

// Base SELECT shared by list/detail/export queries. The LATERAL join finds
// each medicine's nearest (soonest) batch expiry date without an N+1 query.
const BASE_SELECT = `
  SELECT
    m.id, m.name, m.generic_name, m.sku, m.description,
    m.category_id, c.name AS category_name,
    m.supplier_id, s.name AS supplier_name,
    m.price, m.quantity, m.minimum_stock, m.image_url,
    m.created_at, m.updated_at,
    batch_info.nearest_expiry,
    batch_info.batch_number AS latest_batch_number,
    batch_info.purchase_price AS latest_purchase_price
  FROM medicines m
  LEFT JOIN categories c ON c.id = m.category_id
  LEFT JOIN suppliers s ON s.id = m.supplier_id
  LEFT JOIN LATERAL (
    SELECT mb.expiry_date AS nearest_expiry, mb.batch_number, mb.purchase_price
    FROM medicine_batches mb
    WHERE mb.medicine_id = m.id
    ORDER BY mb.expiry_date ASC
    LIMIT 1
  ) batch_info ON TRUE
`;

/**
 * Builds a parameterized WHERE clause from validated filter input.
 * Every value is bound as a placeholder — never string-concatenated —
 * to prevent SQL injection.
 */
const buildWhereClause = (filters, startIndex = 1) => {
  const clauses = [filters.showDeleted ? 'm.is_deleted = TRUE' : 'm.is_deleted = FALSE'];
  const params = [];
  let i = startIndex;

  if (filters.search) {
    clauses.push(`(
      m.name ILIKE $${i} OR
      m.generic_name ILIKE $${i} OR
      m.sku ILIKE $${i} OR
      EXISTS (
        SELECT 1 FROM medicine_batches mb2
        WHERE mb2.medicine_id = m.id AND mb2.batch_number ILIKE $${i}
      )
    )`);
    params.push(`%${filters.search}%`);
    i += 1;
  }

  if (filters.category) {
    clauses.push(`m.category_id = $${i}`);
    params.push(filters.category);
    i += 1;
  }

  if (filters.supplier) {
    clauses.push(`m.supplier_id = $${i}`);
    params.push(filters.supplier);
    i += 1;
  }

  if (filters.minPrice !== undefined) {
    clauses.push(`m.price >= $${i}`);
    params.push(filters.minPrice);
    i += 1;
  }

  if (filters.maxPrice !== undefined) {
    clauses.push(`m.price <= $${i}`);
    params.push(filters.maxPrice);
    i += 1;
  }

  if (filters.stockStatus === 'out') {
    clauses.push('m.quantity = 0');
  } else if (filters.stockStatus === 'low') {
    clauses.push('m.quantity > 0 AND m.quantity <= m.minimum_stock');
  } else if (filters.stockStatus === 'in-stock') {
    clauses.push('m.quantity > m.minimum_stock');
  }

  return { clauses, params, nextIndex: i };
};

/**
 * The expiry filter depends on the LATERAL join alias, so it is applied via
 * HAVING-style post-filtering in the outer query (wrapped as a subquery)
 * rather than in the WHERE clause, which cannot reference the LATERAL alias.
 */
const buildExpiryPredicate = (expiryStatus, startIndex) => {
  if (!expiryStatus) return { clause: '', params: [], nextIndex: startIndex };
  if (expiryStatus === 'expired') {
    return { clause: 'AND nearest_expiry IS NOT NULL AND nearest_expiry < CURRENT_DATE', params: [], nextIndex: startIndex };
  }
  if (expiryStatus === 'expiring-soon') {
    return {
      clause: `AND nearest_expiry IS NOT NULL AND nearest_expiry >= CURRENT_DATE AND nearest_expiry <= CURRENT_DATE + $${startIndex}::int`,
      params: [EXPIRING_SOON_DAYS],
      nextIndex: startIndex + 1,
    };
  }
  // ok
  return {
    clause: `AND (nearest_expiry IS NULL OR nearest_expiry > CURRENT_DATE + $${startIndex}::int)`,
    params: [EXPIRING_SOON_DAYS],
    nextIndex: startIndex + 1,
  };
};

const parseSort = (sort) => {
  let field = sort || '-created_at';
  let direction = 'ASC';
  if (field.startsWith('-')) {
    direction = 'DESC';
    field = field.slice(1);
  }
  const column = MEDICINE_SORT_FIELDS[field] || MEDICINE_SORT_FIELDS.created_at;
  return `${column} ${direction} NULLS LAST`;
};

const findAndCount = async (filters) => {
  const { clauses, params, nextIndex } = buildWhereClause(filters);
  const expiry = buildExpiryPredicate(filters.expiryStatus, nextIndex);
  const allParams = [...params, ...expiry.params];

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const orderSql = parseSort(filters.sort);
  const offset = (filters.page - 1) * filters.limit;

  const limitIdx = allParams.length + 1;
  const offsetIdx = allParams.length + 2;

  const sql = `
    SELECT * FROM (
      ${BASE_SELECT}
      ${whereSql}
    ) sub
    WHERE TRUE ${expiry.clause}
    ORDER BY ${orderSql.replace('m.', 'sub.')}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const countSql = `
    SELECT COUNT(*)::int AS total FROM (
      ${BASE_SELECT}
      ${whereSql}
    ) sub
    WHERE TRUE ${expiry.clause}
  `;

  const [dataResult, countResult] = await Promise.all([
    query(sql, [...allParams, filters.limit, offset]),
    query(countSql, allParams),
  ]);

  return { rows: dataResult.rows, total: countResult.rows[0].total };
};

/** Used by CSV export — same filters, no pagination limit (capped for safety). */
const findAllForExport = async (filters) => {
  const { clauses, params, nextIndex } = buildWhereClause(filters);
  const expiry = buildExpiryPredicate(filters.expiryStatus, nextIndex);
  const allParams = [...params, ...expiry.params];
  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const sql = `
    SELECT * FROM (
      ${BASE_SELECT}
      ${whereSql}
    ) sub
    WHERE TRUE ${expiry.clause}
    ORDER BY sub.name ASC
    LIMIT 5000
  `;
  const { rows } = await query(sql, allParams);
  return rows;
};

const findById = async (id) => {
  const sql = `${BASE_SELECT} WHERE m.id = $1 AND m.is_deleted = FALSE`;
  const { rows } = await query(sql, [id]);
  return rows[0] || null;
};

const findBySku = async (sku, excludeId = null) => {
  const sql = excludeId
    ? 'SELECT id FROM medicines WHERE sku = $1 AND id != $2 AND is_deleted = FALSE'
    : 'SELECT id FROM medicines WHERE sku = $1 AND is_deleted = FALSE';
  const params = excludeId ? [sku, excludeId] : [sku];
  const { rows } = await query(sql, params);
  return rows[0] || null;
};

const create = async (client, medicine) => {
  const {
    name, generic_name, sku, description, category_id, supplier_id,
    price, quantity, minimum_stock, image_url,
  } = medicine;
  const { rows } = await client.query(
    `INSERT INTO medicines
       (name, generic_name, sku, description, category_id, supplier_id, price, quantity, minimum_stock, image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [name, generic_name || null, sku, description || null, category_id, supplier_id,
      price, quantity || 0, minimum_stock ?? 10, image_url || null]
  );
  return rows[0];
};

const addBatch = async (client, medicineId, batch) => {
  const { batch_number, quantity, purchase_price, expiry_date } = batch;
  if (!batch_number || !expiry_date) return null;
  const { rows } = await client.query(
    `INSERT INTO medicine_batches (medicine_id, batch_number, quantity, purchase_price, expiry_date)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (medicine_id, batch_number)
     DO UPDATE SET quantity = medicine_batches.quantity + EXCLUDED.quantity
     RETURNING *`,
    [medicineId, batch_number, quantity || 0, purchase_price || null, expiry_date]
  );
  return rows[0];
};

const update = async (id, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return findById(id);
  const setClause = keys.map((key, idx) => `${key} = $${idx + 2}`).join(', ');
  const values = keys.map((k) => fields[k]);
  const { rows } = await query(
    `UPDATE medicines SET ${setClause} WHERE id = $1 AND is_deleted = FALSE RETURNING id`,
    [id, ...values]
  );
  return rows[0] ? findById(id) : null;
};

const softDelete = async (id) => {
  const { rows } = await query(
    `UPDATE medicines SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1 AND is_deleted = FALSE RETURNING id`,
    [id]
  );
  return rows[0] || null;
};

const restore = async (id) => {
  const { rows } = await query(
    `UPDATE medicines SET is_deleted = FALSE, deleted_at = NULL WHERE id = $1 AND is_deleted = TRUE RETURNING id`,
    [id]
  );
  return rows[0] || null;
};

const updateQuantity = async (client, id, newQuantity) => {
  const { rows } = await client.query(
    `UPDATE medicines SET quantity = $2 WHERE id = $1 RETURNING *`,
    [id, newQuantity]
  );
  return rows[0];
};

const getLowStock = async () => {
  const sql = `${BASE_SELECT} WHERE m.is_deleted = FALSE AND m.quantity > 0 AND m.quantity <= m.minimum_stock ORDER BY m.quantity ASC`;
  const { rows } = await query(sql);
  return rows;
};

const getOutOfStock = async () => {
  const sql = `${BASE_SELECT} WHERE m.is_deleted = FALSE AND m.quantity = 0 ORDER BY m.name ASC`;
  const { rows } = await query(sql);
  return rows;
};

const getExpired = async () => {
  const sql = `
    SELECT * FROM (${BASE_SELECT} WHERE m.is_deleted = FALSE) sub
    WHERE sub.nearest_expiry IS NOT NULL AND sub.nearest_expiry < CURRENT_DATE
    ORDER BY sub.nearest_expiry ASC
  `;
  const { rows } = await query(sql);
  return rows;
};

const getExpiringSoon = async () => {
  const sql = `
    SELECT * FROM (${BASE_SELECT} WHERE m.is_deleted = FALSE) sub
    WHERE sub.nearest_expiry IS NOT NULL
      AND sub.nearest_expiry >= CURRENT_DATE
      AND sub.nearest_expiry <= CURRENT_DATE + $1::int
    ORDER BY sub.nearest_expiry ASC
  `;
  const { rows } = await query(sql, [EXPIRING_SOON_DAYS]);
  return rows;
};

module.exports = {
  findAndCount, findAllForExport, findById, findBySku, create, addBatch,
  update, softDelete, restore, updateQuantity, getLowStock, getOutOfStock, getExpired,
  getExpiringSoon, withTransaction,
};