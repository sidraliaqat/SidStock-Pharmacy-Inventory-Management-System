const router = require('express').Router();
const medicineController = require('../controllers/medicineController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { uploadMedicineImage } = require('../middleware/uploadMiddleware');
const {
  createMedicineSchema, updateMedicineSchema, medicineQuerySchema,
} = require('../validators/medicineValidators');
const { ROLES } = require('../constants');

router.use(authenticate);

// Static/reserved paths must be registered before the /:id param route.
router.get('/low-stock', medicineController.lowStock);
router.get('/out-of-stock', medicineController.outOfStock);
router.get('/expired', medicineController.expired);
router.get('/expiring-soon', medicineController.expiringSoon);
router.get('/export', requireRole(ROLES.ADMIN), validate(medicineQuerySchema, 'query'), medicineController.exportCsv);

router.get('/', validate(medicineQuerySchema, 'query'), medicineController.list);
router.get('/:id', medicineController.getById);

router.post(
  '/',
  requireRole(ROLES.ADMIN),
  uploadMedicineImage,
  validate(createMedicineSchema),
  medicineController.create
);

router.put(
  '/:id',
  requireRole(ROLES.ADMIN),
  uploadMedicineImage,
  validate(updateMedicineSchema),
  medicineController.update
);

router.delete('/:id', requireRole(ROLES.ADMIN), medicineController.remove);
router.patch('/:id/restore', requireRole(ROLES.ADMIN), medicineController.restore);

module.exports = router;