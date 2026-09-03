const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { ROLES } = require('../constants');

router.use(authenticate);

router.get('/admin', requireRole(ROLES.ADMIN), dashboardController.admin);
router.get('/user', dashboardController.user);

module.exports = router;
