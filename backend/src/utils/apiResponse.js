/**
 * Consistent success/error envelope for every API response.
 */
const success = (res, { message = 'Success', data = null, meta = {}, statusCode = 200 } = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...meta,
  });
};

const error = (res, { message = 'Something went wrong', statusCode = 500, errors = undefined } = {}) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { success, error };
