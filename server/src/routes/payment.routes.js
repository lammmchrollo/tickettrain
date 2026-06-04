const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const {
	createPayment,
	confirmMockPayment,
	completeLegacyPayment,
	momoReturn,
	momoNotify,
	mockCheckoutPage,
    zaloPayReturn,    // ← thêm
    zaloPayCallback,  // ← thêmthêm
	mockCompletePayment
} = require('../controllers/payment.controller');

router.post('/create', auth, createPayment);
router.post('/mock-confirm', auth, confirmMockPayment);
router.post('/complete-legacy', auth, completeLegacyPayment);

router.get('/momo-return', momoReturn);
router.post('/momo-notify', momoNotify);
router.get('/mock-checkout', mockCheckoutPage);
router.get('/mock-complete', mockCompletePayment);

module.exports = router;
