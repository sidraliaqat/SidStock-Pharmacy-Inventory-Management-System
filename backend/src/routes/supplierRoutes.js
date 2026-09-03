const router = require('express').Router();
const supplierController = require('../controllers/supplierController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { supplierSchema, supplierUpdateSchema } = require('../validators/supplierValidators');
const { ROLES } = require('../constants');

router.use(authenticate);

router.get('/', supplierController.list);
router.get('/:id', supplierController.getById);
router.post('/', requireRole(ROLES.ADMIN), validate(supplierSchema), supplierController.create);
router.put('/:id', requireRole(ROLES.ADMIN), validate(supplierUpdateSchema), supplierController.update);
router.delete('/:id', requireRole(ROLES.ADMIN), supplierController.remove);

module.exports = router;
