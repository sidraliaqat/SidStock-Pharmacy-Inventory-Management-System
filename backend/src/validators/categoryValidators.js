const Joi = require('joi');

const categorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().allow('', null).max(500),
});

const categoryUpdateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  description: Joi.string().trim().allow('', null).max(500),
}).min(1);

module.exports = { categorySchema, categoryUpdateSchema };
