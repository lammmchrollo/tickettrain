const Train = require('../models/train.model');
const Carriage = require('../models/carriage.model');
const Seat = require('../models/seat.model');
const SeatHold = require('../models/seatHold.model');
const Owner = require('../models/owner.model');

const ownerSnapshotFrom = (owner) => {
  if (!owner) return null;
  return {
    id: owner._id,
    name: owner.name,
    contactName: owner.contactName,
    phone: owner.phone,
    email: owner.email,
    type: owner.type
  };
};

exports.searchTrains = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'Thieu ga di hoac ga den' });
    }

    const trains = await Train.find({
      fromStationCode: from,
      toStationCode: to,
      isActive: true,
      status: 'published'
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
          owner: train.ownerId ? ownerSnapshotFrom(train.ownerId) : train.ownerSnapshot || null,
          status: train.status,
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
    const { trainCode, trainName, trainType, fromStationCode, toStationCode, departureTime, arrivalTime, durationText, ownerId, status } = req.body;

    if (!trainCode || !trainName || !fromStationCode || !toStationCode) {
      return res.status(400).json({ success: false, message: 'Thieu thong tin chuyen tau' });
    }

    const payload = { trainCode, trainName, trainType, fromStationCode, toStationCode, departureTime, arrivalTime, durationText, status: status === 'published' ? 'published' : 'draft' };
    if (ownerId) {
      payload.ownerId = ownerId;
      const owner = await Owner.findById(ownerId);
      payload.ownerSnapshot = ownerSnapshotFrom(owner);
    }

    const t = await Train.create(payload);
    res.json({ success: true, data: t });
  } catch (error) {
    next(error);
  }
};

exports.updateTrain = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.ownerId) {
      const owner = await Owner.findById(updates.ownerId);
      updates.ownerSnapshot = ownerSnapshotFrom(owner);
    }
    const t = await Train.findByIdAndUpdate(id, updates, { new: true });
    res.json({ success: true, data: t });
  } catch (error) {
    next(error);
  }
};

exports.publishTrain = async (req, res, next) => {
  try {
    const { id } = req.params;
    const train = await Train.findByIdAndUpdate(
      id,
      { status: 'published', publishedAt: new Date(), cancelledAt: null },
      { new: true }
    );
    if (!train) return res.status(404).json({ success: false, message: 'Khong tim thay chuyen tau' });
    res.json({ success: true, data: train });
  } catch (error) {
    next(error);
  }
};

exports.cancelTrain = async (req, res, next) => {
  try {
    const { id } = req.params;
    const train = await Train.findByIdAndUpdate(
      id,
      { status: 'cancelled', cancelledAt: new Date() },
      { new: true }
    );
    if (!train) return res.status(404).json({ success: false, message: 'Khong tim thay chuyen tau' });
    res.json({ success: true, data: train });
  } catch (error) {
    next(error);
  }
};

exports.listOwnerTrains = async (req, res, next) => {
  try {
    const { ownerId } = req.params;
    const trains = await Train.find({ ownerId }).sort({ createdAt: -1 });
    res.json({ success: true, data: trains });
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
