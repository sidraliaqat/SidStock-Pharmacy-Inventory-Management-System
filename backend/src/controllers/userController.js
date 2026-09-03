const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const userService = require('../services/userService');

const list = asyncHandler(async (req, res) => {
  const data = await userService.list();
  success(res, { message: 'Users fetched successfully.', data });
});

const getById = asyncHandler(async (req, res) => {
  const data = await userService.getById(req.params.id);
  success(res, { message: 'User fetched successfully.', data });
});

const create = asyncHandler(async (req, res) => {
  const data = await userService.createStaff(req.body);
  success(res, { statusCode: 201, message: 'User account created successfully.', data });
});

const update = asyncHandler(async (req, res) => {
  const data = await userService.update(req.params.id, req.body, req.user.id);
  success(res, { message: 'User updated successfully.', data });
});

const remove = asyncHandler(async (req, res) => {
  await userService.remove(req.params.id, req.user.id);
  success(res, { message: 'User deleted successfully.', data: { id: req.params.id } });
});

module.exports = { list, getById, create, update, remove };
