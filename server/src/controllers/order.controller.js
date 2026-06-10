const Train = require('../models/train.model');
const Seat = require('../models/seat.model');
const SeatHold = require('../models/seatHold.model');
const Order = require('../models/order.model');
const { calculatePricing } = require('../services/pricing.service');
const { encryptText } = require('../services/crypto.service');
const { maskPhone, maskNationalId, maskFullName, maskEmail } = require('../utils/mask');
const { generateCode } = require('../utils/generateCode');
const { logAudit } = require('../middlewares/audit.middleware');

/**
 * Sanitize order data trước khi trả về cho customer
 * 
 * Mục đích: loại bỏ tất cả trường encrypted khỏi response.
 * Chỉ trả lại dữ liệu đã masked — đủ để hiển thị, không đủ để tái tạo PII.
 * 
 * Các trường bị loại bỏ:
 * - phoneEncrypted, nationalIdEncrypted (đã có từ trước)
 * - fullNameEncrypted, emailEncrypted (mới thêm)
 * 
 * Tham chiếu OWASP:
 * - A01:2021 – Broken Access Control (data exposure)
 */
const sanitizeOrderForCustomer = (orderDoc) => {
  const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;

  return {
    _id: order._id,
    orderCode: order.orderCode,
    trainSnapshot: order.trainSnapshot,
    selectedSeats: order.selectedSeats,
    passengers: (order.passengers || []).map((p) => ({
      fullName: p.fullName,
      phoneMasked: p.phoneMasked,
      nationalIdMasked: p.nationalIdMasked,
      emailMasked: p.emailMasked || ''
    })),
    pricing: order.pricing,
    promotionSnapshot: order.promotionSnapshot,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
};

exports.quote = async (req, res, next) => {
  try {
    const { seatIds, promoCode } = req.body;

    const seats = await Seat.find({ _id: { $in: seatIds } });

    if (!seats.length) {
      return res.status(400).json({ success: false, message: 'Khong tim thay ghe' });
    }

    const pricing = await calculatePricing({ seats, promoCode });
    res.json({ success: true, data: pricing });
  } catch (error) {
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const { holdId, passengers, promoCode } = req.body;

    if (!holdId || !Array.isArray(passengers) || !passengers.length) {
      return res.status(400).json({ success: false, message: 'Thieu holdId hoac passenger info' });
    }

    const hold = await SeatHold.findOne({
      _id: holdId,
      userId: req.user.id,
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    if (!hold) {
      return res.status(400).json({ success: false, message: 'Giu cho khong con hieu luc' });
    }

    const train = await Train.findById(hold.trainId);
    const seats = await Seat.find({ _id: { $in: hold.seatIds } });

    const pricing = await calculatePricing({ seats, promoCode });

    const passengerPayload = passengers.map((p) => {
      const rawEmail = p.email || '';
      return {
        fullName: maskFullName(p.fullName),
        fullNameEncrypted: encryptText(p.fullName),
        phoneEncrypted: encryptText(p.phone),
        phoneMasked: maskPhone(p.phone),
        nationalIdEncrypted: encryptText(p.nationalId),
        nationalIdMasked: maskNationalId(p.nationalId),
        emailEncrypted: rawEmail ? encryptText(rawEmail) : undefined,
        emailMasked: rawEmail ? maskEmail(rawEmail) : '',
        email: rawEmail ? maskEmail(rawEmail) : ''
      };
    });

    const order = await Order.create({
      orderCode: generateCode('OD'),
      userId: req.user.id,
      trainId: train._id,
      holdId: hold._id,
      trainSnapshot: {
        trainCode: train.trainCode,
        trainName: train.trainName,
        fromStationCode: train.fromStationCode,
        toStationCode: train.toStationCode,
        departureTime: train.departureTime,
        arrivalTime: train.arrivalTime,
        durationText: train.durationText
      },
      selectedSeats: seats.map((s) => ({
        seatId: s._id,
        seatNumber: s.seatNumber,
        classType: s.classType,
        basePrice: s.basePrice
      })),
      passengers: passengerPayload,
      pricing,
      promotionSnapshot: pricing.promotion,
      paymentStatus: 'pending',
      orderStatus: 'pending_payment'
    });

    // ── Audit Log: tạo đơn hàng ─────────────────────────────────
    logAudit({
      userId: req.user.id,
      action: 'ORDER_CREATED',
      resource: 'Order',
      resourceId: order._id.toString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Order ${order.orderCode} created. Total: ${order.pricing.total}`
    }).catch(() => {});

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderCode: order.orderCode,
        pricing: order.pricing
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: orders.map(sanitizeOrderForCustomer)
    });
  } catch (error) {
    next(error);
  }
};
