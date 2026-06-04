require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  EMAIL_VERIFY_SECRET: process.env.EMAIL_VERIFY_SECRET,
  EMAIL_VERIFY_TTL: process.env.EMAIL_VERIFY_TTL || '30m',
  OTP_EXPIRES_MINUTES: process.env.OTP_EXPIRES_MINUTES || '5',
  OTP_RESEND_COOLDOWN_SECONDS: process.env.OTP_RESEND_COOLDOWN_SECONDS || '60',
  OTP_MAX_ATTEMPTS: process.env.OTP_MAX_ATTEMPTS || '5',
  OTP_RESEND_MAX_PER_HOUR: process.env.OTP_RESEND_MAX_PER_HOUR || '5',
  DATA_ENCRYPTION_KEY: process.env.DATA_ENCRYPTION_KEY,
  APP_ORIGIN: process.env.APP_ORIGIN || 'http://localhost:5173,http://localhost,https://localhost,capacitor://localhost',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000',
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || '587',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_SECURE: process.env.SMTP_SECURE || 'false',
  EMAIL_FROM: process.env.EMAIL_FROM || 'no-reply@vetau.local'
};
