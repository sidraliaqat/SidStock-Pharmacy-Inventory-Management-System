const { withTransaction } = require('../config/db');
const medicineRepository = require('../repositories/medicineRepository');
const categoryRepository = require('../repositories/categoryRepository');
const supplierRepository = require('../repositories/supplierRepository');
const inventoryRepository = require('../repositories/inventoryRepository');
const ApiError = require('../utils/ApiError');
const { getStockStatus, getExpiryStatus } = require('../utils/stockStatus');
const { toCsv } = require('../utils/csv');

/** Attaches computed (never stored) status fields to a medicine row. */
const enrich = (row) => ({
  ...row,
  price: Number(row.price),
  stock_status: getStockStatus(row.quantity, row.minimum_stock),
  expiry_status: getExpiryStatus(row.nearest_expiry),
});

const list = async (filters) => {
  const { rows, total } = await medicineRepository.findAndCount(filters);
  return {
    data: rows.map(enrich),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    },
  };
};

const getById = async (id) => {
  const medicine = await medicineRepository.findById(id);
  if (!medicine) throw new ApiError(404, 'Medicine not found.');
  return enrich(medicine);
};

const assertCategoryAndSupplierExist = async (categoryId, supplierId) => {
  if (categoryId) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) throw new ApiError(422, 'Selected category does not exist.');
  }
  if (supplierId) {
    const supplier = await supplierRepository.findById(supplierId);
    if (!supplier) throw new ApiError(422, 'Selected supplier does not exist.');
  }
};

const create = async (payload, userId) => {
  const existingSku = await medicineRepository.findBySku(payload.sku);
  if (existingSku) throw new ApiError(409, `SKU "${payload.sku}" is already in use.`);
  await assertCategoryAndSupplierExist(payload.category_id, payload.supplier_id);

  return withTransaction(async (client) => {
    const medicine = await medicineRepository.create(client, payload);

    if (payload.batch_number && payload.expiry_date) {
      await medicineRepository.addBatch(client, medicine.id, {
        batch_number: payload.batch_number,
        quantity: payload.quantity || 0,
        purchase_price: payload.purchase_price,
        expiry_date: payload.expiry_date,
      });
    }

    if (payload.quantity > 0) {
      await inventoryRepository.insertHistory(client, {
        medicine_id: medicine.id,
        user_id: userId,
        transaction_type: 'IN',
        quantity: payload.quantity,
        previous_quantity: 0,
        new_quantity: payload.quantity,
        reason: 'Initial stock on creation',
      });
    }

    return medicine.id;
  });
};

const update = async (id, payload) => {
  const existing = await medicineRepository.findById(id);
  if (!existing) throw new ApiError(404, 'Medicine not found.');

  if (payload.sku && payload.sku !== existing.sku) {
    const clash = await medicineRepository.findBySku(payload.sku, id);
    if (clash) throw new ApiError(409, `SKU "${payload.sku}" is already in use.`);
  }
  await assertCategoryAndSupplierExist(payload.category_id, payload.supplier_id);

  const updated = await medicineRepository.update(id, payload);
  if (!updated) throw new ApiError(404, 'Medicine not found.');
  return enrich(updated);
};

const remove = async (id) => {
  const deleted = await medicineRepository.softDelete(id);
  if (!deleted) throw new ApiError(404, 'Medicine not found.');
  return { id };
};

const restore = async (id) => {
  const restored = await medicineRepository.restore(id);
  if (!restored) throw new ApiError(404, 'Deleted medicine not found.');
  return getById(id);
};

const lowStock = async () => (await medicineRepository.getLowStock()).map(enrich);
const outOfStock = async () => (await medicineRepository.getOutOfStock()).map(enrich);
const expired = async () => (await medicineRepository.getExpired()).map(enrich);
const expiringSoon = async () => (await medicineRepository.getExpiringSoon()).map(enrich);

const deriveOverallStatus = (row) => {
  const stock = getStockStatus(row.quantity, row.minimum_stock);
  const expiry = getExpiryStatus(row.nearest_expiry);
  if (stock === 'OUT OF STOCK') return stock;
  if (expiry !== 'OK') return expiry;
  return stock;
};

const exportCsv = async (filters) => {
  const rows = await medicineRepository.findAllForExport(filters);
  const columns = [
    { key: 'name', label: 'Medicine Name' },
    { key: 'generic_name', label: 'Generic Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'category_name', label: 'Category' },
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'price', label: 'Price' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'minimum_stock', label: 'Minimum Stock' },
    { key: 'latest_batch_number', label: 'Batch Number' },
    { key: 'nearest_expiry', label: 'Expiry Date' },
    { key: 'status', label: 'Status' },
  ];
  const enriched = rows.map((r) => ({
    ...r,
    nearest_expiry: r.nearest_expiry ? new Date(r.nearest_expiry).toISOString().slice(0, 10) : '',
    status: deriveOverallStatus(r),
  }));
  return toCsv(columns, enriched);
};

module.exports = {
  list, getById, create, update, remove, restore,
  lowStock, outOfStock, expired, expiringSoon, exportCsv, enrich,
};