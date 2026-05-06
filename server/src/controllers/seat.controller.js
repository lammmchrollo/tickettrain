const Seat = require('../models/seat.model');
const SeatHold = require('../models/seatHold.model');

exports.holdSeats = async (req, res, next) => {
  try {
    const { trainId, seatIds } = req.body;

    if (!trainId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Thieu trainId hoac seatIds' });
    }

    const seats = await Seat.find({
      _id: { $in: seatIds },
      trainId
    });

    if (seats.length !== seatIds.length) {
      return res.status(400).json({ success: false, message: 'Co ghe khong hop le' });
    }

    const soldSeat = seats.find((s) => s.status === 'sold');
    if (soldSeat) {
      return res.status(409).json({ success: false, message: `Ghe ${soldSeat.seatNumber} da ban` });
    }

    const existingHold = await SeatHold.findOne({
      status: 'active',
      expiresAt: { $gt: new Date() },
      seatIds: { $in: seatIds }
    });

    if (existingHold) {
      return res.status(409).json({ success: false, message: 'Mot hoac nhieu ghe dang duoc giu' });
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const hold = await SeatHold.create({
      userId: req.user.id,
      trainId,
      seatIds,
      status: 'active',
      expiresAt
    });

    res.json({
      success: true,
      data: {
        holdId: hold._id,
        expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};
