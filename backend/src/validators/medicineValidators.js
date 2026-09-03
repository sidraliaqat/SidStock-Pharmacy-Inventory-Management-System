const Joi = require('joi');

const createMedicineSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  generic_name: Joi.string().trim().allow('', null).max(150),
  sku: Joi.string().trim().min(2).max(60).required(),
  description: Joi.string().trim().allow('', null).max(2000),
  category_id: Joi.number().integer().positive().required(),
  supplier_id: Joi.number().integer().positive().required(),
  price: Joi.number().positive().precision(2).required(),
  quantity: Joi.number().integer().min(0).default(0),
  minimum_stock: Joi.number().integer().min(0).default(10),
  batch_number: Joi.string().trim().max(80).allow('', null),
  purchase_price: Joi.number().min(0).allow(null, ''),
  expiry_date: Joi.date().iso().allow(null, ''),
  image_url: Joi.string().uri().allow('', null),
});

const updateMedicineSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150),
  generic_name: Joi.string().trim().allow('', null).max(150),
  sku: Joi.string().trim().min(2).max(60),
  description: Joi.string().trim().allow('', null).max(2000),
  category_id: Joi.number().integer().positive(),
  supplier_id: Joi.number().integer().positive(),
  price: Joi.number().positive().precision(2),
  minimum_stock: Joi.number().integer().min(0),
  image_url: Joi.string().uri().allow('', null),
}).min(1);

const medicineQuerySchema = Joi.object({
  search: Joi.string().trim().allow('').max(150),
  category: Joi.number().integer().positive(),
  supplier: Joi.number().integer().positive(),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  stockStatus: Joi.string().valid('in-stock', 'low', 'out'),
  expiryStatus: Joi.string().valid('ok', 'expiring-soon', 'expired'),
  showDeleted: Joi.boolean().default(false),
  sort: Joi.string().max(30).default('-created_at'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { createMedicineSchema, updateMedicineSchema, medicineQuerySchema };