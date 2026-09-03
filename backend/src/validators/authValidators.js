const Joi = require('joi');
const { GMAIL_PATTERN } = require('./patterns');

const gmailEmail = () => Joi.string().trim().lowercase().pattern(GMAIL_PATTERN)
  .messages({ 'string.pattern.base': 'email must be a valid @gmail.com address' });

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  email: gmailEmail().required(),
  password: Joi.string().min(8).max(72).required()
    .messages({ 'string.min': 'password must be at least 8 characters long' }),
});

const loginSchema = Joi.object({
  email: gmailEmail().required(),
  password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };
