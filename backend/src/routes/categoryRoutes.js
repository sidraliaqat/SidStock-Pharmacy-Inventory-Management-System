const router = require('express').Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { categorySchema, categoryUpdateSchema } = require('../validators/categoryValidators');
const { ROLES } = require('../constants');

router.use(authenticate);

router.get('/', categoryController.list);
router.get('/:id', categoryController.getById);
router.post('/', requireRole(ROLES.ADMIN), validate(categorySchema), categoryController.create);
router.put('/:id', requireRole(ROLES.ADMIN), validate(categoryUpdateSchema), categoryController.update);
router.delete('/:id', requireRole(ROLES.ADMIN), categoryController.remove);

module.exports = router;
