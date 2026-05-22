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
    emailVerifySendWindowStart: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
