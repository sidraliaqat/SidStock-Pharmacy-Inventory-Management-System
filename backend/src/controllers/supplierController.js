const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const supplierService = require('../services/supplierService');

const list = asyncHandler(async (req, res) => {
  const data = await supplierService.list(req.query.search);
  success(res, { message: 'Suppliers fetched successfully.', data });
});

const getById = asyncHandler(async (req, res) => {
  const data = await supplierService.getById(req.params.id);
  success(res, { message: 'Supplier fetched successfully.', data });
});

const create = asyncHandler(async (req, res) => {
  const data = await supplierService.create(req.body);
  success(res, { statusCode: 201, message: 'Supplier created successfully.', data });
});

const update = asyncHandler(async (req, res) => {
  const data = await supplierService.update(req.params.id, req.body);
  success(res, { message: 'Supplier updated successfully.', data });
});

const remove = asyncHandler(async (req, res) => {
  await supplierService.remove(req.params.id);
  success(res, { message: 'Supplier deleted successfully.', data: { id: req.params.id } });
});

module.exports = { list, getById, create, update, remove };
