const mongoose = require('mongoose');

const CarriageSchema = new mongoose.Schema(
  {
    trainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
    carriageCode: { type: String, required: true },
    carriageType: { type: String, required: true },
    seatCount: { type: Number, required: true },
    basePrice: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Carriage', CarriageSchema);
