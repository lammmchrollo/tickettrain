/**
 * Auth Routes
 * 
 * Middleware chain cho mỗi route:
 * 1. Input Validator — kiểm tra format (email, password strength)
 * 2. Controller — xử lý business logic
 * 
 * Rate limiting được áp dụng ở tầng app.js (authLimiter)
 */

const router = require('express').Router();
const { validateRegister, validateLogin } = require('../middlewares/inputValidator.middleware');
const {
	sendRegisterOtp,
	login,
	verifyRegisterOtp,
	resendRegisterOtp
} = require('../controllers/auth.controller');

// Đăng ký: validate → send OTP
router.post('/register/send-otp', validateRegister, sendRegisterOtp);

// Xác minh OTP
router.post('/register/verify-otp', verifyRegisterOtp);

// Gửi lại OTP
router.post('/register/resend-otp', resendRegisterOtp);

// Đăng nhập: validate → login
router.post('/login', validateLogin, login);

module.exports = router;
