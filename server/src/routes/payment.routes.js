const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const {
	createPayment,
	confirmMockPayment,
	completeLegacyPayment
} = require('../controllers/payment.controller');

router.post('/create', auth, createPayment);
router.post('/mock-confirm', auth, confirmMockPayment);
router.post('/complete-legacy', auth, completeLegacyPayment);

// return endpoints (VNPay)
const { vnpayReturn, mockCheckoutPage, mockCompletePayment } = require('../controllers/payment.controller');
router.get('/vnpay-return', vnpayReturn);
router.get('/mock-checkout', mockCheckoutPage);
router.get('/mock-complete', mockCompletePayment);

module.exports = router;
