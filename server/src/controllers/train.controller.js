const Train = require('../models/train.model');
const Carriage = require('../models/carriage.model');
const Seat = require('../models/seat.model');
const SeatHold = require('../models/seatHold.model');

exports.searchTrains = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'Thieu ga di hoac ga den' });
    }

    const trains = await Train.find({
      fromStationCode: from,
      toStationCode: to,
      isActive: true
    }).sort({ departureTime: 1 }).populate('ownerId', 'name contactName phone email');

    const data = await Promise.all(
      trains.map(async (train) => {
        const totalSeats = await Seat.countDocuments({ trainId: train._id, status: 'available' });
        const activeHolds = await SeatHold.aggregate([
          { $match: { trainId: train._id, status: 'active', expiresAt: { $gt: new Date() } } },
          { $project: { count: { $size: '$seatIds' } } }
        ]);

        const holdingCount = activeHolds.reduce((sum, item) => sum + item.count, 0);

        const firstCarriage = await Carriage.findOne({ trainId: train._id }).sort({ basePrice: 1 });

        return {
          id: train._id,
          trainCode: train.trainCode,
          trainName: train.trainName,
          trainType: train.trainType,
          owner: train.ownerId
            ? { id: train.ownerId._id, name: train.ownerId.name, contactName: train.ownerId.contactName, phone: train.ownerId.phone, email: train.ownerId.email }
            : train.ownerSnapshot || null,
          departureTime: train.departureTime,
          arrivalTime: train.arrivalTime,
          durationText: train.durationText,
          rating: train.rating,
          isPremium: train.isPremium,
          basePrice: firstCarriage ? firstCarriage.basePrice : 0,
          availableSeats: Math.max(totalSeats - holdingCount, 0)
        };
      })
    );

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.createTrain = async (req, res, next) => {
  try {
    const { trainCode, trainName, trainType, fromStationCode, toStationCode, departureTime, arrivalTime, durationText, ownerId } = req.body;

    if (!trainCode || !trainName || !fromStationCode || !toStationCode) {
      return res.status(400).json({ success: false, message: 'Thieu thong tin chuyen tau' });
    }

    const payload = { trainCode, trainName, trainType, fromStationCode, toStationCode, departureTime, arrivalTime, durationText };
    if (ownerId) payload.ownerId = ownerId;

    const t = await Train.create(payload);
    res.json({ success: true, data: t });
  } catch (error) {
    next(error);
  }
};

exports.updateTrain = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const t = await Train.findByIdAndUpdate(id, updates, { new: true });
    res.json({ success: true, data: t });
  } catch (error) {
    next(error);
  }
};

exports.getTrainSeats = async (req, res, next) => {
  try {
    const { trainId } = req.params;

    const carriages = await Carriage.find({ trainId }).sort({ basePrice: 1 });
    const seats = await Seat.find({ trainId });
    const activeHolds = await SeatHold.find({
      trainId,
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    const heldSeatIds = new Set(activeHolds.flatMap((h) => h.seatIds.map(String)));

    const result = carriages.map((carriage) => ({
      id: carriage._id,
      carriageCode: carriage.carriageCode,
      carriageType: carriage.carriageType,
      seatCount: carriage.seatCount,
      basePrice: carriage.basePrice,
      seats: seats
        .filter((s) => String(s.carriageId) === String(carriage._id))
        .map((s) => ({
          id: s._id,
          seatNumber: s.seatNumber,
          classType: s.classType,
          basePrice: s.basePrice,
          status: s.status === 'sold' ? 'sold' : heldSeatIds.has(String(s._id)) ? 'holding' : 'available'
        }))
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
