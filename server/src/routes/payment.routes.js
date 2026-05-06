const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const {
	createPayment,
	confirmMockPayment,
	completeLegacyPayment
} = require('../controllers/payment.controller');

router.post('/create', auth, createPayment);
router.post('/mock-confirm', auth, confirmMockPayment);
router.post('/complete-legacy', auth, completeLegacyPayment);

module.exports = router;
