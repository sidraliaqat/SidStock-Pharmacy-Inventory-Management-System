const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const authService = require('../services/authService');

const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  const { password_hash, ...safeUser } = user;
  success(res, {
    statusCode: 201,
    message: 'Account created successfully.',
    data: { user: safeUser, token },
  });
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  success(res, { message: 'Logged in successfully.', data: { user, token } });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  success(res, { message: 'Current user fetched.', data: user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  success(res, { message: 'Profile updated successfully.', data: user });
});

module.exports = { register, login, me, updateProfile };
