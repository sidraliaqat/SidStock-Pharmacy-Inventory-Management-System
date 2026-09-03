const Joi = require('joi');

const stockMutationSchema = Joi.object({
  quantity: Joi.number().integer().positive().required(),
  reason: Joi.string().trim().min(2).max(255).required(),
  batch_number: Joi.string().trim().max(80).allow('', null),
  expiry_date: Joi.date().iso().allow('', null),
  purchase_price: Joi.number().min(0).allow('', null),
});

const historyQuerySchema = Joi.object({
  medicine: Joi.number().integer().positive(),
  type: Joi.string().valid('IN', 'OUT'),
  user: Joi.number().integer().positive(),
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { stockMutationSchema, historyQuerySchema };
