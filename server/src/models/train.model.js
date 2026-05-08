const mongoose = require('mongoose');

const TrainSchema = new mongoose.Schema(
  {
    trainCode: { type: String, required: true, unique: true, trim: true },
    trainName: { type: String, required: true, trim: true },
    trainType: { type: String, required: true, trim: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' },
    ownerSnapshot: { type: Object },
    fromStationCode: { type: String, required: true },
    toStationCode: { type: String, required: true },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    durationText: { type: String, required: true },
    rating: { type: Number, default: 4.5 },
    isPremium: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Train', TrainSchema);
