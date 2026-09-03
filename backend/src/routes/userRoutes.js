const router = require('express').Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createStaffSchema, updateUserSchema } = require('../validators/userValidators');
const { ROLES } = require('../constants');

// Every user-management route is admin-only per spec.
router.use(authenticate, requireRole(ROLES.ADMIN));

router.get('/', userController.list);
router.get('/:id', userController.getById);
router.post('/', validate(createStaffSchema), userController.create);
router.put('/:id', validate(updateUserSchema), userController.update);
router.delete('/:id', userController.remove);

module.exports = router;
