/* eslint-disable no-console */
const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Maps common PostgreSQL error codes to safe, user-facing messages so we
// never leak raw database internals to the client.
const mapDatabaseError = (err) => {
  switch (err.code) {
    case '23505': // unique_violation
      return new ApiError(409, 'A record with these details already exists.');
    case '23503': // foreign_key_violation
      return new ApiError(409, 'This action cannot be completed because related records exist.');
    case '23514': // check_violation
      return new ApiError(422, 'One or more values violate a data constraint.');
    case '22P02': // invalid_text_representation
      return new ApiError(400, 'Invalid request format.');
    default:
      return null;
  }
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let apiError = err;

  if (!(err instanceof ApiError)) {
    apiError = mapDatabaseError(err) || new ApiError(500, 'Internal server error.');
  }

  if (!apiError.isOperational) {
    console.error('Unexpected error:', err);
  } else if (apiError.statusCode >= 500) {
    console.error('Server error:', err);
  }

  const body = {
    success: false,
    message: apiError.message || 'Something went wrong.',
  };
  if (apiError.errors) body.errors = apiError.errors;

  res.status(apiError.statusCode || 500).json(body);
};

module.exports = { notFound, errorHandler };
