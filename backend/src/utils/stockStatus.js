const { STOCK_STATUS, EXPIRY_STATUS, EXPIRING_SOON_DAYS } = require('../constants');

/**
 * Derive a live stock status from quantity vs minimum_stock.
 * Never stored — always computed, per spec.
 */
const getStockStatus = (quantity, minimumStock) => {
  if (Number(quantity) <= 0) return STOCK_STATUS.OUT_OF_STOCK;
  if (Number(quantity) <= Number(minimumStock)) return STOCK_STATUS.LOW_STOCK;
  return STOCK_STATUS.IN_STOCK;
};

/**
 * Derive a live expiry status from the medicine's nearest batch expiry date.
 */
const getExpiryStatus = (nearestExpiryDate) => {
  if (!nearestExpiryDate) return EXPIRY_STATUS.OK;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(nearestExpiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return EXPIRY_STATUS.EXPIRED;
  if (diffDays <= EXPIRING_SOON_DAYS) return EXPIRY_STATUS.EXPIRING_SOON;
  return EXPIRY_STATUS.OK;
};

module.exports = { getStockStatus, getExpiryStatus };
