const mongoose = require('mongoose');

const PendingRegistrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: null },
    resendCount: { type: Number, default: 0 },
    resendWindowStart: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PendingRegistration', PendingRegistrationSchema);
