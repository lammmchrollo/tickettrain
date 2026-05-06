const mongoose = require('mongoose');

const SeatHoldSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
    seatIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true }],
    status: {
      type: String,
      enum: ['active', 'expired', 'converted', 'cancelled'],
      default: 'active'
    },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

SeatHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SeatHold', SeatHoldSchema);
