const ApiError = require('../utils/ApiError');

/**
 * Restrict a route to one or more roles. Must run after authenticate().
 * Backend is the source of truth for authorization — the frontend hiding
 * a button is never sufficient on its own.
 */
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required.'));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action.'));
  }
  next();
};

module.exports = { requireRole };
