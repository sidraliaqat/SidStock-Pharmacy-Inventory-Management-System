/**
 * Wraps an async Express route/controller so thrown errors and rejected
 * promises are forwarded to the centralized error middleware instead of
 * crashing the process or requiring try/catch in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
