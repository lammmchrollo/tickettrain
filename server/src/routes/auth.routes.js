const router = require('express').Router();
const {
	sendRegisterOtp,
	login,
	verifyRegisterOtp,
	resendRegisterOtp
} = require('../controllers/auth.controller');

router.post('/register/send-otp', sendRegisterOtp);
router.post('/register/verify-otp', verifyRegisterOtp);
router.post('/register/resend-otp', resendRegisterOtp);
router.post('/login', login);

module.exports = router;
