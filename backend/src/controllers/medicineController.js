const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const medicineService = require('../services/medicineService');

const buildImageUrl = (req) => (req.file ? `/uploads/${req.file.filename}` : undefined);

const list = asyncHandler(async (req, res) => {
  const result = await medicineService.list(req.query);
  success(res, {
    message: 'Medicines fetched successfully.',
    data: result.data,
    meta: { pagination: result.pagination },
  });
});

const getById = asyncHandler(async (req, res) => {
  const medicine = await medicineService.getById(req.params.id);
  success(res, { message: 'Medicine fetched successfully.', data: medicine });
});

const create = asyncHandler(async (req, res) => {
  const imageUrl = buildImageUrl(req);
  const payload = { ...req.body };
  if (imageUrl) payload.image_url = imageUrl;
  const id = await medicineService.create(payload, req.user.id);
  const medicine = await medicineService.getById(id);
  success(res, { statusCode: 201, message: 'Medicine created successfully.', data: medicine });
});

const update = asyncHandler(async (req, res) => {
  const imageUrl = buildImageUrl(req);
  const payload = { ...req.body };
  if (imageUrl) payload.image_url = imageUrl;
  const medicine = await medicineService.update(req.params.id, payload);
  success(res, { message: 'Medicine updated successfully.', data: medicine });
});

const remove = asyncHandler(async (req, res) => {
  await medicineService.remove(req.params.id);
  success(res, { message: 'Medicine deleted successfully.', data: { id: req.params.id } });
});

const restore = asyncHandler(async (req, res) => {
  const medicine = await medicineService.restore(req.params.id);
  success(res, { message: 'Medicine restored successfully.', data: medicine });
});

const lowStock = asyncHandler(async (req, res) => {
  const data = await medicineService.lowStock();
  success(res, { message: 'Low stock medicines fetched successfully.', data });
});

const outOfStock = asyncHandler(async (req, res) => {
  const data = await medicineService.outOfStock();
  success(res, { message: 'Out of stock medicines fetched successfully.', data });
});

const expired = asyncHandler(async (req, res) => {
  const data = await medicineService.expired();
  success(res, { message: 'Expired medicines fetched successfully.', data });
});

const expiringSoon = asyncHandler(async (req, res) => {
  const data = await medicineService.expiringSoon();
  success(res, { message: 'Medicines expiring soon fetched successfully.', data });
});

const exportCsv = asyncHandler(async (req, res) => {
  const csv = await medicineService.exportCsv(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="medicines-export.csv"');
  res.status(200).send(csv);
});

module.exports = {
  list, getById, create, update, remove, restore,
  lowStock, outOfStock, expired, expiringSoon, exportCsv,
};