const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const categoryService = require('../services/categoryService');

const list = asyncHandler(async (req, res) => {
  const data = await categoryService.list(req.query.search);
  success(res, { message: 'Categories fetched successfully.', data });
});

const getById = asyncHandler(async (req, res) => {
  const data = await categoryService.getById(req.params.id);
  success(res, { message: 'Category fetched successfully.', data });
});

const create = asyncHandler(async (req, res) => {
  const data = await categoryService.create(req.body);
  success(res, { statusCode: 201, message: 'Category created successfully.', data });
});

const update = asyncHandler(async (req, res) => {
  const data = await categoryService.update(req.params.id, req.body);
  success(res, { message: 'Category updated successfully.', data });
});

const remove = asyncHandler(async (req, res) => {
  await categoryService.remove(req.params.id);
  success(res, { message: 'Category deleted successfully.', data: { id: req.params.id } });
});

module.exports = { list, getById, create, update, remove };
