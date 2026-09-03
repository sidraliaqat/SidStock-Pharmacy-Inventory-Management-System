const ApiError = require('../utils/ApiError');

/**
 * Validates req[source] against a Joi schema. On failure, collects every
 * message and forwards a single 422 through the centralized error handler.
 * Never trusts the frontend alone — this runs on every write endpoint.
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const errors = error.details.map((d) => d.message.replace(/"/g, ''));
    return next(new ApiError(422, 'Validation failed.', errors));
  }

  req[source] = value;
  next();
};

module.exports = { validate };
