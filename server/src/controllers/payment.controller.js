const Order = require('../models/order.model');
const Payment = require('../models/payment.model');
const Ticket = require('../models/ticket.model');
const mongoose = require('mongoose');
const { mockProviderCreatePayment } = require('../services/payment.service');
const { issueTicketsForOrder } = require('../services/ticket.service');
const { generateCode } = require('../utils/generateCode');

exports.createPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      userId: req.user.id
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Khong tim thay don hang' });
    }

    if (order.orderStatus !== 'pending_payment') {
      return res.status(400).json({ success: false, message: 'Don hang khong o trang thai cho thanh toan' });
    }

    const providerData = await mockProviderCreatePayment({
      orderId: order._id,
      amount: order.pricing.total
    });

    const payment = await Payment.create({
      orderId: order._id,
      provider: providerData.provider,
      providerTxnId: providerData.providerTxnId,
      amount: providerData.amount,
      status: 'pending'
    });

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        providerTxnId: payment.providerTxnId,
        amount: payment.amount
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.confirmMockPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Khong tim thay giao dich' });
    }

    const order = await Order.findOne({
      _id: payment.orderId,
      userId: req.user.id
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Khong tim thay don hang' });
    }

    if (payment.status === 'success') {
      return res.json({ success: true, message: 'Giao dich da duoc xac nhan truoc do' });
    }

    payment.status = 'success';
    payment.paidAt = new Date();
    await payment.save();

    order.paymentStatus = 'paid';
    order.orderStatus = 'paid';
    await order.save();

    const tickets = await issueTicketsForOrder(order);

    res.json({
      success: true,
      data: {
        orderId: order._id,
        tickets
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.completeLegacyPayment = async (req, res, next) => {
  try {
    const {
      selectedTrain,
      searchData,
      selectedSeats,
      passengers,
      totalPrice,
      serviceFee,
      discount,
      finalTotal
    } = req.body;

    if (!selectedTrain || !Array.isArray(selectedSeats) || !selectedSeats.length) {
      return res.status(400).json({ success: false, message: 'Thieu thong tin chuyen tau hoac ghe' });
    }

    const userId = req.user.id;
    const syntheticTrainId = new mongoose.Types.ObjectId();
    const seatPayload = selectedSeats.map((seat) => ({
      seatNumber: String(seat),
      classType: selectedTrain.type || 'standard',
      basePrice: Math.round((totalPrice || 0) / Math.max(selectedSeats.length, 1))
    }));

    const order = await Order.create({
      orderCode: generateCode('OD'),
      userId,
      trainId: syntheticTrainId,
      trainSnapshot: {
        trainCode: selectedTrain.name || selectedTrain.trainCode || 'SE',
        trainName: selectedTrain.name || selectedTrain.trainName || 'Tau',
        fromStationCode: searchData?.from || '',
        toStationCode: searchData?.to || '',
        departureTime: selectedTrain.dep || selectedTrain.departureTime || '',
        arrivalTime: selectedTrain.arr || selectedTrain.arrivalTime || '',
        durationText: selectedTrain.dur || selectedTrain.durationText || ''
      },
      selectedSeats: seatPayload,
      passengers: (passengers || []).map((p) => ({
        fullName: p.name || p.fullName || 'Hanh khach',
        phoneEncrypted: { iv: '', content: '', tag: '' },
        phoneMasked: p.phone || '',
        nationalIdEncrypted: { iv: '', content: '', tag: '' },
        nationalIdMasked: p.idCard || p.nationalId || '',
        email: p.email || ''
      })),
      pricing: {
        subtotal: totalPrice || 0,
        serviceFee: serviceFee || 0,
        discount: discount || 0,
        total: finalTotal || totalPrice || 0
      },
      paymentStatus: 'paid',
      orderStatus: 'ticketed'
    });

    const payment = await Payment.create({
      orderId: order._id,
      provider: 'mockpay',
      providerTxnId: generateCode('PM'),
      amount: order.pricing.total,
      status: 'success',
      paidAt: new Date()
    });

    const tickets = [];
    for (let i = 0; i < seatPayload.length; i += 1) {
      const seat = seatPayload[i];
      const passenger = passengers?.[i] || passengers?.[0] || {};
      const ticket = await Ticket.create({
        ticketCode: generateCode('TK'),
        orderId: order._id,
        userId,
        trainSnapshot: order.trainSnapshot,
        seatSnapshot: seat,
        passengerSnapshot: {
          fullName: passenger.name || passenger.fullName || 'Hanh khach',
          phoneMasked: passenger.phone || '',
          nationalIdMasked: passenger.idCard || passenger.nationalId || ''
        },
        ticketStatus: 'issued'
      });
      tickets.push(ticket);
    }

    return res.json({
      success: true,
      data: {
        orderId: order._id,
        paymentId: payment._id,
        tickets,
        finalTotal: order.pricing.total
      }
    });
  } catch (error) {
    return next(error);
  }
};
