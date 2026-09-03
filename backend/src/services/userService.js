const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 10;

const list = () => userRepository.findAll();

const getById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw new ApiError(404, 'User not found.');
  const { password_hash, ...safe } = user;
  return safe;
};

// Only reachable via admin-only routes: creates staff (or admin) accounts.
const createStaff = async ({ name, email, password, role }) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) throw new ApiError(409, 'An account with this email already exists.');
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return userRepository.create({ name, email, passwordHash, role: role || 'staff' });
};

const update = async (id, fields, actingUserId) => {
  const payload = { ...fields };
  if (payload.password) {
    payload.password_hash = await bcrypt.hash(payload.password, SALT_ROUNDS);
    delete payload.password;
  }
  if (Number(id) === Number(actingUserId) && payload.is_active === false) {
    throw new ApiError(422, 'You cannot deactivate your own account.');
  }
  const updated = await userRepository.update(id, payload);
  if (!updated) throw new ApiError(404, 'User not found.');
  return updated;
};

const remove = async (id, actingUserId) => {
  if (Number(id) === Number(actingUserId)) {
    throw new ApiError(422, 'You cannot delete your own account.');
  }
  const deleted = await userRepository.remove(id);
  if (!deleted) throw new ApiError(404, 'User not found.');
  return { id };
};

module.exports = { list, getById, createStaff, update, remove };
