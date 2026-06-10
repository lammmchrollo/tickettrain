const mongoose = require('mongoose');

const EncryptedValueSchema = new mongoose.Schema(
  {
    iv: String,
    content: String,
    tag: String
  },
  { _id: false }
);

const PassengerSchema = new mongoose.Schema(
  {
    /**
     * Tên hành khách — lưu bản viết tắt (masked) để hiển thị
     * Bản gốc được mã hoá trong fullNameEncrypted
     */
    fullName: { type: String, required: true },
    fullNameEncrypted: { type: EncryptedValueSchema },
    phoneEncrypted: { type: EncryptedValueSchema, required: true },
    phoneMasked: { type: String, required: true },
    nationalIdEncrypted: { type: EncryptedValueSchema, required: true },
    nationalIdMasked: { type: String, required: true },
    /**
     * Email hành khách — mã hoá khi có giá trị
     * emailMasked: bản hiển thị che bớt (u***@example.com)
     */
    emailEncrypted: { type: EncryptedValueSchema },
    emailMasked: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
    holdId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeatHold' },

    trainSnapshot: {
      trainCode: String,
      trainName: String,
      fromStationCode: String,
      toStationCode: String,
      departureTime: String,
      arrivalTime: String,
      durationText: String
    },

    selectedSeats: [
      {
        seatId: mongoose.Schema.Types.ObjectId,
        seatNumber: String,
        classType: String,
        basePrice: Number
      }
    ],

    passengers: [PassengerSchema],

    pricing: {
      subtotal: Number,
      serviceFee: Number,
      discount: Number,
      total: Number
    },

    promotionSnapshot: {
      code: String,
      type: String,
      value: Number
    },

    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'failed'],
      default: 'unpaid'
    },
    orderStatus: {
      type: String,
      enum: ['draft', 'pending_payment', 'paid', 'ticketed', 'cancelled', 'expired'],
      default: 'draft'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
