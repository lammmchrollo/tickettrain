/**
 * Express Application — Middleware Stack
 * 
 * Kiến trúc middleware theo thứ tự (Defense-in-Depth):
 * 
 * 1. Helmet         — HTTP Security Headers
 * 2. Body Parser    — Giới hạn kích thước request body (10KB)
 * 3. CORS           — Kiểm soát nguồn gốc request
 * 4. Input Sanitizer — Chống NoSQL Injection + XSS
 * 5. Rate Limiter   — Giới hạn số request (global + per-route)
 * 6. Input Validator — Kiểm tra format dữ liệu đầu vào
 * 7. Auth + RBAC    — JWT verify + role-based access control
 * 8. Error Handler  — Ẩn chi tiết lỗi ở production
 * 
 * Thứ tự này đảm bảo:
 * - Request bị chặn sớm nhất có thể (fail-fast)
 * - Security middleware chạy trước business logic
 * - Error handler luôn ở cuối (catch-all)
 * 
 * Tham chiếu OWASP:
 * - A05:2021 – Security Misconfiguration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { APP_ORIGIN } = require('./config/env');
const errorHandler = require('./middlewares/error.middleware');
const inputSanitizer = require('./middlewares/inputSanitizer.middleware');
const { validateRegister, validateLogin, validatePassengers } = require('./middlewares/inputValidator.middleware');
const { auditMiddleware } = require('./middlewares/audit.middleware');

const authRoutes = require('./routes/auth.routes');
const trainRoutes = require('./routes/train.routes');
const seatRoutes = require('./routes/seat.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const ticketRoutes = require('./routes/ticket.routes');
const ownerRoutes = require('./routes/owner.routes');

const app = express();
const allowedOrigins = APP_ORIGIN.split(',').map((v) => v.trim()).filter(Boolean);

// ─── Rate Limiters ──────────────────────────────────────────────────────────

/**
 * Auth Rate Limiter — 30 requests / 15 phút
 * Chống brute force login và OTP enumeration
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Qua nhieu yeu cau xac thuc. Vui long thu lai sau.' }
});

/**
 * Payment Rate Limiter — 60 requests / 15 phút
 * Chống spam thanh toán
 */
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Qua nhieu yeu cau thanh toan. Vui long thu lai sau.' }
});

// ─── Middleware Stack (thứ tự quan trọng!) ───────────────────────────────────

// 1. HTTP Security Headers — thiết lập trước mọi response
app.use(helmet());

/**
 * 2. Body Parser với giới hạn kích thước 10KB
 * 
 * Mục đích:
 * - Chống Denial of Service bằng payload quá lớn
 * - Request body > 10KB → HTTP 413 Payload Too Large
 * - 10KB đủ cho tất cả API endpoint của ứng dụng
 * 
 * Tham chiếu OWASP:
 * - A05:2021 – Security Misconfiguration
 */
app.use(express.json({ limit: '10kb' }));

// 3. CORS — chỉ cho phép origin trong whitelist
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true
}));

/**
 * 4. Input Sanitizer (global) — chạy sau JSON parse, trước mọi route
 * 
 * Loại bỏ MongoDB operators ($gt, $regex...) và escape HTML entities
 * Bảo vệ toàn bộ API khỏi NoSQL Injection và Stored XSS
 */
app.use(inputSanitizer);

/**
 * 5. Global Rate Limiter — 300 requests / 15 phút
 * Chống DDoS cơ bản cho toàn bộ API
 */
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
}));

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server OK' });
});

// Auth routes — với rate limiter riêng
app.use('/api/auth', authLimiter, authRoutes);

// Train routes — public (tìm kiếm) + admin (CRUD)
app.use('/api/trains', trainRoutes);

// Seat routes
app.use('/api/seats', seatRoutes);

// Owner routes — admin only, audit log mọi truy cập
app.use('/api/owners', auditMiddleware('ADMIN_ACCESS', 'Owner'), ownerRoutes);

// Order routes
app.use('/api/orders', orderRoutes);

// Payment routes — với rate limiter riêng
app.use('/api/payments', paymentLimiter, paymentRoutes);

// Ticket routes
app.use('/api/tickets', ticketRoutes);

// ─── Error Handler (cuối cùng) ──────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
