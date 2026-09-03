const { withTransaction } = require('../config/db');
const medicineRepository = require('../repositories/medicineRepository');
const inventoryRepository = require('../repositories/inventoryRepository');
const ApiError = require('../utils/ApiError');
const { TRANSACTION_TYPES } = require('../constants');

/**
 * Stock IN: BEGIN -> lock row -> update quantity -> add/merge batch (optional)
 * -> insert history -> COMMIT. Any failure ROLLBACKs the whole operation so
 * quantity and history can never drift apart.
 */
const stockIn = async (medicineId, { quantity, reason, batch_number, expiry_date, purchase_price }, userId) => {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      'SELECT id, quantity FROM medicines WHERE id = $1 AND is_deleted = FALSE FOR UPDATE',
      [medicineId]
    );
    const medicine = rows[0];
    if (!medicine) throw new ApiError(404, 'Medicine not found.');

    const previousQuantity = medicine.quantity;
    const newQuantity = previousQuantity + quantity;

    const updated = await medicineRepository.updateQuantity(client, medicineId, newQuantity);

    if (batch_number && expiry_date) {
      await medicineRepository.addBatch(client, medicineId, {
        batch_number, quantity, purchase_price, expiry_date,
      });
    }

    const history = await inventoryRepository.insertHistory(client, {
      medicine_id: medicineId,
      user_id: userId,
      transaction_type: TRANSACTION_TYPES.IN,
      quantity,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      reason,
    });

    return { medicine: updated, history };
  });
};

/**
 * Stock OUT: BEGIN -> lock row -> verify sufficient quantity -> update
 * -> insert history -> COMMIT. Quantity is never allowed to go negative;
 * insufficient stock rolls the transaction back and returns 422.
 */
const stockOut = async (medicineId, { quantity, reason }, userId) => {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      'SELECT id, quantity FROM medicines WHERE id = $1 AND is_deleted = FALSE FOR UPDATE',
      [medicineId]
    );
    const medicine = rows[0];
    if (!medicine) throw new ApiError(404, 'Medicine not found.');

    const previousQuantity = medicine.quantity;
    if (quantity > previousQuantity) {
      throw new ApiError(422, `Insufficient stock. Only ${previousQuantity} unit(s) available.`);
    }
    const newQuantity = previousQuantity - quantity;

    const updated = await medicineRepository.updateQuantity(client, medicineId, newQuantity);

    const history = await inventoryRepository.insertHistory(client, {
      medicine_id: medicineId,
      user_id: userId,
      transaction_type: TRANSACTION_TYPES.OUT,
      quantity,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      reason,
    });

    return { medicine: updated, history };
  });
};

const history = (filters) => inventoryRepository.findAndCount(filters);

const historyForMedicine = async (medicineId, filters) =>
  inventoryRepository.findAndCount({ ...filters, medicine: medicineId });

module.exports = { stockIn, stockOut, history, historyForMedicine };
