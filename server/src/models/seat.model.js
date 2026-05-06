const mongoose = require('mongoose');

const SeatSchema = new mongoose.Schema(
  {
    trainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
    carriageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Carriage', required: true },
    seatNumber: { type: String, required: true },
    classType: { type: String, required: true },
    basePrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['available', 'sold'],
      default: 'available'
    }
  },
  { timestamps: true }
);

SeatSchema.index({ trainId: 1, carriageId: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('Seat', SeatSchema);
