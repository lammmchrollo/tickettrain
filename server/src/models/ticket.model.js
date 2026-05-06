const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema(
  {
    ticketCode: { type: String, required: true, unique: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    trainSnapshot: {
      trainCode: String,
      trainName: String,
      fromStationCode: String,
      toStationCode: String,
      departureTime: String,
      arrivalTime: String,
      durationText: String
    },

    seatSnapshot: {
      seatId: mongoose.Schema.Types.ObjectId,
      seatNumber: String,
      classType: String,
      basePrice: Number
    },

    passengerSnapshot: {
      fullName: String,
      phoneMasked: String,
      nationalIdMasked: String
    },

    ticketStatus: {
      type: String,
      enum: ['issued', 'used', 'cancelled'],
      default: 'issued'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', TicketSchema);
