const Joi = require('joi');
const { GMAIL_PATTERN } = require('./patterns');

const gmailEmail = () => Joi.string().trim().lowercase().pattern(GMAIL_PATTERN)
  .messages({ 'string.pattern.base': 'email must be a valid @gmail.com address' });

const createStaffSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  email: gmailEmail().required(),
  password: Joi.string().min(8).max(72).required(),
  role: Joi.string().valid('admin', 'staff').default('staff'),
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150),
  email: gmailEmail(),
  is_active: Joi.boolean(),
  role: Joi.string().valid('admin', 'staff'),
  password: Joi.string().min(8).max(72).allow('', null),
}).min(1);

module.exports = { createStaffSchema, updateUserSchema };
