const router = require('express').Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { stockMutationSchema, historyQuerySchema } = require('../validators/inventoryValidators');

router.use(authenticate);

// Both admin and staff may perform allowed stock operations (per spec).
router.post('/:medicineId/in', validate(stockMutationSchema), inventoryController.stockIn);
router.post('/:medicineId/out', validate(stockMutationSchema), inventoryController.stockOut);

router.get('/history', validate(historyQuerySchema, 'query'), inventoryController.history);
router.get('/history/:medicineId', validate(historyQuerySchema, 'query'), inventoryController.historyForMedicine);

module.exports = router;
