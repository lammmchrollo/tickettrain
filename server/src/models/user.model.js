const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, default: null },
    emailVerifyLastSentAt: { type: Date, default: null },
    emailVerifySendCount: { type: Number, default: 0 },
    emailVerifySendWindowStart: { type: Date, default: null },
    /**
     * Account Lockout fields
     * 
     * Cơ chế: sau MAX_FAILED_ATTEMPTS lần login sai liên tiếp,
     * tài khoản bị khoá đến thời điểm lockUntil.
     * Reset về 0 khi login thành công.
     * 
     * Tham chiếu OWASP:
     * - A07:2021 – Identification and Authentication Failures
     */
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
