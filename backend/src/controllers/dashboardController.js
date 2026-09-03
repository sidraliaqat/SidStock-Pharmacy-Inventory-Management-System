const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboardService');

const admin = asyncHandler(async (req, res) => {
  const data = await dashboardService.adminSummary();
  success(res, { message: 'Admin dashboard data fetched successfully.', data });
});

const user = asyncHandler(async (req, res) => {
  const data = await dashboardService.userSummary();
  success(res, { message: 'Dashboard data fetched successfully.', data });
});

module.exports = { admin, user };
