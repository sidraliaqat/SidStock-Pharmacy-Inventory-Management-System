const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const userRepository = require('../repositories/userRepository');

/**
 * Verifies the JWT on the Authorization header, loads the current user
 * from PostgreSQL (so revoked/disabled accounts are rejected even with a
 * still-valid token), and attaches it to req.user.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Authentication required. Please log in.');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired session. Please log in again.');
  }

  const user = await userRepository.findById(decoded.id);
  if (!user || !user.is_active) {
    throw new ApiError(401, 'Account is unavailable. Please contact an administrator.');
  }

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  next();
});

module.exports = { authenticate };
