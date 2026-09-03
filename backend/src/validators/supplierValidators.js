const Joi = require('joi');
const { PK_PHONE_PATTERN } = require('./patterns');

const phoneRule = Joi.string().trim().pattern(PK_PHONE_PATTERN)
  .messages({
    'string.pattern.base': 'Phone must be a Pakistani number: +92XXXXXXXXXX, 0XXXXXXXXXX, or +92-XXX-XXXXXXX.',
  })
  .allow('', null);

// Both email and phone stay individually optional, but at least one of the
// two must be provided so a supplier always has a way to be contacted.
const requireOneContact = (value, helpers) => {
  const hasEmail = !!(value.email && value.email.trim());
  const hasPhone = !!(value.phone && value.phone.trim());
  if (!hasEmail && !hasPhone) {
    return helpers.error('supplier.contactRequired');
  }
  return value;
};

const supplierSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).allow('', null),
  phone: phoneRule,
  address: Joi.string().trim().max(500).allow('', null),
})
  .custom(requireOneContact)
  .messages({ 'supplier.contactRequired': 'Provide at least an email or a phone number.' });

const supplierUpdateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150),
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).allow('', null),
  phone: phoneRule,
  address: Joi.string().trim().max(500).allow('', null),
})
  .min(1)
  .custom((value, helpers) => {
    // Only enforce on update when the request is actually touching email
    // and/or phone — untouched fields keep whatever the record already has.
    if ('email' in value || 'phone' in value) {
      return requireOneContact(value, helpers);
    }
    return value;
  })
  .messages({ 'supplier.contactRequired': 'Provide at least an email or a phone number.' });

module.exports = { supplierSchema, supplierUpdateSchema };