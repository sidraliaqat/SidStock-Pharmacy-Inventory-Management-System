const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const { signToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants');

const SALT_ROUNDS = 10;

// Public self-registration always creates a STAFF account — the spec
// forbids the public from choosing the admin role. Admins are created
// only via the Admin Users page (see userService.createStaff).
const register = async ({ name, email, password }) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepository.create({ name, email, passwordHash, role: ROLES.STAFF });
  const token = signToken({ id: user.id, role: user.role });
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.is_active) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  const token = signToken({ id: user.id, role: user.role });
  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token };
};

const getCurrentUser = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw new ApiError(404, 'User not found.');
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

const updateProfile = async (id, { name, password }) => {
  const fields = {};
  if (name) fields.name = name;
  if (password) fields.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const updated = await userRepository.update(id, fields);
  if (!updated) throw new ApiError(404, 'User not found.');
  return updated;
};

module.exports = { register, login, getCurrentUser, updateProfile };
