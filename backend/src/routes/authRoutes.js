const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { registerSchema, loginSchema } = require('../validators/authValidators');
const Joi = require('joi');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.me);
router.put(
  '/me',
  authenticate,
  validate(Joi.object({
    name: Joi.string().trim().min(2).max(150),
    password: Joi.string().min(8).max(72),
  }).min(1)),
  authController.updateProfile
);

module.exports = router;
