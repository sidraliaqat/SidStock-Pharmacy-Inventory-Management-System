const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const inventoryService = require('../services/inventoryService');

const stockIn = asyncHandler(async (req, res) => {
  const result = await inventoryService.stockIn(req.params.medicineId, req.body, req.user.id);
  success(res, { message: 'Stock added successfully.', data: result });
});

const stockOut = asyncHandler(async (req, res) => {
  const result = await inventoryService.stockOut(req.params.medicineId, req.body, req.user.id);
  success(res, { message: 'Stock removed successfully.', data: result });
});

const history = asyncHandler(async (req, res) => {
  const { rows, total } = await inventoryService.history(req.query);
  success(res, {
    message: 'Inventory history fetched successfully.',
    data: rows,
    meta: {
      pagination: {
        page: req.query.page,
        limit: req.query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / req.query.limit)),
      },
    },
  });
});

const historyForMedicine = asyncHandler(async (req, res) => {
  const { rows, total } = await inventoryService.historyForMedicine(req.params.medicineId, req.query);
  success(res, {
    message: 'Medicine inventory history fetched successfully.',
    data: rows,
    meta: {
      pagination: {
        page: req.query.page,
        limit: req.query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / req.query.limit)),
      },
    },
  });
});

module.exports = { stockIn, stockOut, history, historyForMedicine };
