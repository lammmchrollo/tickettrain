const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { APP_ORIGIN } = require('./config/env');
const errorHandler = require('./middlewares/error.middleware');

const authRoutes = require('./routes/auth.routes');
const trainRoutes = require('./routes/train.routes');
const seatRoutes = require('./routes/seat.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const ticketRoutes = require('./routes/ticket.routes');
const ownerRoutes = require('./routes/owner.routes');

const app = express();
const allowedOrigins = APP_ORIGIN.split(',').map((v) => v.trim()).filter(Boolean);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Qua nhieu yeu cau xac thuc. Vui long thu lai sau.' }
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Qua nhieu yeu cau thanh toan. Vui long thu lai sau.' }
});

app.use(helmet());
app.use(express.json());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server OK' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/tickets', ticketRoutes);

app.use(errorHandler);

module.exports = app;
