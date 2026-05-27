const Ticket = require('../models/ticket.model');
const Seat = require('../models/seat.model');
const SeatHold = require('../models/seatHold.model');
const Order = require('../models/order.model');
const { generateCode } = require('../utils/generateCode');

async function issueTicketsForOrder(order) {
  const issuedTickets = [];

  for (const seat of order.selectedSeats) {
    const passenger = order.passengers[0] || {};
    const ticket = await Ticket.create({
      ticketCode: generateCode('TK'),
      orderId: order._id,
      userId: order.userId,
      trainSnapshot: order.trainSnapshot,
      seatSnapshot: seat,
      passengerSnapshot: {
        fullName: passenger.fullName || 'Hanh khach',
        phoneMasked: passenger.phoneMasked || '',
        nationalIdMasked: passenger.nationalIdMasked || ''
      },
      ticketStatus: 'issued'
    });

    issuedTickets.push(ticket);
  }

  await Seat.updateMany(
    { _id: { $in: order.selectedSeats.map((s) => s.seatId) } },
    { $set: { status: 'sold' } }
  );

  if (order.holdId) {
    await SeatHold.findByIdAndUpdate(order.holdId, { status: 'converted' });
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      io.to(`train_${order.trainId}`).emit('seat:reserved', {
        seatIds: order.selectedSeats.map((s) => s.seatId),
        orderId: order._id
      });
    } catch (err) {
      // non-fatal
    }
  }

  await Order.findByIdAndUpdate(order._id, {
    orderStatus: 'ticketed',
    paymentStatus: 'paid'
  });

  return issuedTickets;
}

module.exports = { issueTicketsForOrder };
