const Order = require('../models/order.model');
const Payment = require('../models/payment.model');
const Ticket = require('../models/ticket.model');
const mongoose = require('mongoose');
const { mockProviderCreatePayment } = require('../services/payment.service');
const { createMoMo, verifyMoMoSignature } = require('../services/momo.service');
const { createZaloPay, verifyZaloPayCallback } = require('../services/zalopay.service');
const { issueTicketsForOrder } = require('../services/ticket.service');
const { generateCode } = require('../utils/generateCode');
const { encryptText } = require('../services/crypto.service');
const { maskPhone, maskNationalId } = require('../utils/mask');

// ─── Helper dùng chung ────────────────────────────────────────────────────────
const appendQuery = (base, params) => {
  const hasQuery = base.includes('?');
  const queryStr = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${base}${hasQuery ? '&' : '?'}${queryStr}`;
};

const settlePaymentAndRedirect = async ({ payment, status, res }) => {
  const clientUrl = process.env.CLIENT_RETURN_URL || '/';

  if (!payment) {
    return res.redirect(appendQuery(clientUrl, { status: 'failed', provider: 'mock' }));
  }

  if (status === 'success' && payment.status !== 'success') {
    payment.status = 'success';
    payment.paidAt = new Date();
    await payment.save();

    const order = await Order.findById(payment.orderId);
    if (order) {
      order.paymentStatus = 'paid';
      order.orderStatus   = 'paid';
      await order.save();
      await issueTicketsForOrder(order);
    }
  }

  return res.redirect(
    appendQuery(clientUrl, { status, provider: payment.provider, orderId: payment.orderId })
  );
};

// ─── createPayment ────────────────────────────────────────────────────────────
exports.createPayment = async (req, res, next) => {
  try {
    const { provider, orderId } = req.body;
    const isDemo = String(process.env.PAYMENT_DEMO || '').toLowerCase() === 'true';

    let order = null;

    if (orderId) {
      order = await Order.findOne({ _id: orderId, userId: req.user.id });
      if (!order)
        return res.status(404).json({ success: false, message: 'Khong tim thay don hang' });
      if (order.orderStatus !== 'pending_payment')
        return res.status(400).json({ success: false, message: 'Don hang khong o trang thai cho thanh toan' });
    } else {
      const {
        selectedTrain, searchData, selectedSeats,
        passengers, totalPrice, serviceFee, discount, finalTotal
      } = req.body;

      if (!selectedTrain || !Array.isArray(selectedSeats) || !selectedSeats.length)
        return res.status(400).json({ success: false, message: 'Thieu thong tin chuyen tau hoac ghe' });

      if (!Array.isArray(passengers) || !passengers.length)
        return res.status(400).json({ success: false, message: 'Thieu thong tin hanh khach' });

      const userId           = req.user.id;
      const syntheticTrainId = new mongoose.Types.ObjectId();

      const seatPayload = selectedSeats.map((seat) => ({
        seatNumber: String(seat),
        classType:  selectedTrain.type || 'standard',
        basePrice:  Math.round((totalPrice || 0) / Math.max(selectedSeats.length, 1))
      }));

      const passengerPayload = passengers.map((p) => {
        const fullName      = String(p.name || p.fullName || 'Hanh khach').trim();
        const phoneRaw      = String(p.phone || '').trim();
        const nationalIdRaw = String(p.idCard || p.nationalId || '').trim();

        if (!phoneRaw || !nationalIdRaw)
          throw Object.assign(
            new Error('Thieu so dien thoai hoac CCCD/CMND cua hanh khach'),
            { status: 400 }
          );

        return {
          fullName,
          phoneEncrypted:      encryptText(phoneRaw),
          phoneMasked:         maskPhone(phoneRaw),
          nationalIdEncrypted: encryptText(nationalIdRaw),
          nationalIdMasked:    maskNationalId(nationalIdRaw),
          email: p.email || ''
        };
      });

      order = await Order.create({
        orderCode: generateCode('OD'),
        userId,
        trainId: syntheticTrainId,
        trainSnapshot: {
          trainCode:       selectedTrain.name || selectedTrain.trainCode || 'SE',
          trainName:       selectedTrain.name || selectedTrain.trainName || 'Tau',
          fromStationCode: searchData?.from || '',
          toStationCode:   searchData?.to   || '',
          departureTime:   selectedTrain.dep || selectedTrain.departureTime || '',
          arrivalTime:     selectedTrain.arr || selectedTrain.arrivalTime   || '',
          durationText:    selectedTrain.dur || selectedTrain.durationText  || ''
        },
        selectedSeats:  seatPayload,
        passengers:     passengerPayload,
        pricing: {
          subtotal:   totalPrice  || 0,
          serviceFee: serviceFee  || 0,
          discount:   discount    || 0,
          total:      finalTotal  || totalPrice || 0
        },
        paymentStatus: 'pending',
        orderStatus:   'pending_payment'
      });
    }

    const amount = order.pricing.total;
    let providerData = null;

    if (provider === 'momo') {
      const returnUrl = process.env.MOMO_RETURN_URL
        || `${req.protocol}://${req.get('host')}/api/payments/momo-return`;
      const notifyUrl = process.env.MOMO_NOTIFY_URL
        || `${req.protocol}://${req.get('host')}/api/payments/momo-notify`;
      providerData = await createMoMo({ orderId: order._id, amount, returnUrl, notifyUrl });

    } else if (provider === 'zalopay') {
      const returnUrl   = process.env.ZALOPAY_RETURN_URL
        || `${req.protocol}://${req.get('host')}/api/payments/zalopay-return`;
      const callbackUrl = process.env.ZALOPAY_CALLBACK_URL
        || `${req.protocol}://${req.get('host')}/api/payments/zalopay-callback`;
      providerData = await createZaloPay({ orderId: order._id, amount, returnUrl, callbackUrl });

    } else {
      providerData = await mockProviderCreatePayment({ orderId: order._id, amount });
    }

    const payment = await Payment.create({
      orderId:       order._id,
      provider:      providerData.provider,
      providerTxnId: providerData.providerTxnId,
      amount:        providerData.amount,
      status:        'pending',
      checkoutUrl:   providerData.checkoutUrl || null
    });

    console.log('[payment] checkoutUrl', payment.checkoutUrl);

    if (isDemo) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      payment.checkoutUrl = `${baseUrl}/api/payments/mock-checkout?paymentId=${payment._id}`;
      await payment.save();
    }

    res.json({
      success: true,
      data: {
        paymentId:   payment._id,
        checkoutUrl: payment.checkoutUrl,
        provider:    payment.provider
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── confirmMockPayment ───────────────────────────────────────────────────────
exports.confirmMockPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment)
      return res.status(404).json({ success: false, message: 'Khong tim thay giao dich' });

    const order = await Order.findOne({ _id: payment.orderId, userId: req.user.id });
    if (!order)
      return res.status(404).json({ success: false, message: 'Khong tim thay don hang' });

    if (payment.status === 'success')
      return res.json({ success: true, message: 'Giao dich da duoc xac nhan truoc do' });

    payment.status = 'success';
    payment.paidAt = new Date();
    await payment.save();

    order.paymentStatus = 'paid';
    order.orderStatus   = 'paid';
    await order.save();

    const tickets = await issueTicketsForOrder(order);

    res.json({ success: true, data: { orderId: order._id, tickets } });
  } catch (error) {
    next(error);
  }
};

// ─── completeLegacyPayment ────────────────────────────────────────────────────
exports.completeLegacyPayment = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(410).json({
        success: false,
        message: 'Luong thanh toan legacy da ngung hoat dong'
      });
    }

    const {
      selectedTrain, searchData, selectedSeats,
      passengers, totalPrice, serviceFee, discount, finalTotal
    } = req.body;

    if (!selectedTrain || !Array.isArray(selectedSeats) || !selectedSeats.length)
      return res.status(400).json({ success: false, message: 'Thieu thong tin chuyen tau hoac ghe' });

    if (!Array.isArray(passengers) || !passengers.length)
      return res.status(400).json({ success: false, message: 'Thieu thong tin hanh khach' });

    const userId           = req.user.id;
    const syntheticTrainId = new mongoose.Types.ObjectId();

    const seatPayload = selectedSeats.map((seat) => ({
      seatNumber: String(seat),
      classType:  selectedTrain.type || 'standard',
      basePrice:  Math.round((totalPrice || 0) / Math.max(selectedSeats.length, 1))
    }));

    const passengerPayload = passengers.map((p) => {
      const fullName      = String(p.name || p.fullName || 'Hanh khach').trim();
      const phoneRaw      = String(p.phone || '').trim();
      const nationalIdRaw = String(p.idCard || p.nationalId || '').trim();

      if (!phoneRaw || !nationalIdRaw)
        throw Object.assign(
          new Error('Thieu so dien thoai hoac CCCD/CMND cua hanh khach'),
          { status: 400 }
        );

      return {
        fullName,
        phoneEncrypted:      encryptText(phoneRaw),
        phoneMasked:         maskPhone(phoneRaw),
        nationalIdEncrypted: encryptText(nationalIdRaw),
        nationalIdMasked:    maskNationalId(nationalIdRaw),
        email: p.email || ''
      };
    });

    const order = await Order.create({
      orderCode: generateCode('OD'),
      userId,
      trainId: syntheticTrainId,
      trainSnapshot: {
        trainCode:       selectedTrain.name || selectedTrain.trainCode || 'SE',
        trainName:       selectedTrain.name || selectedTrain.trainName || 'Tau',
        fromStationCode: searchData?.from || '',
        toStationCode:   searchData?.to   || '',
        departureTime:   selectedTrain.dep || selectedTrain.departureTime || '',
        arrivalTime:     selectedTrain.arr || selectedTrain.arrivalTime   || '',
        durationText:    selectedTrain.dur || selectedTrain.durationText  || ''
      },
      selectedSeats:  seatPayload,
      passengers:     passengerPayload,
      pricing: {
        subtotal:   totalPrice  || 0,
        serviceFee: serviceFee  || 0,
        discount:   discount    || 0,
        total:      finalTotal  || totalPrice || 0
      },
      paymentStatus: 'paid',
      orderStatus:   'ticketed'
    });

    const payment = await Payment.create({
      orderId:       order._id,
      provider:      'mockpay',
      providerTxnId: generateCode('PM'),
      amount:        order.pricing.total,
      status:        'success',
      paidAt:        new Date()
    });

    const tickets = [];
    for (let i = 0; i < seatPayload.length; i += 1) {
      const seat      = seatPayload[i];
      const passenger = passengerPayload[i] || passengerPayload[0] || {};
      const ticket    = await Ticket.create({
        ticketCode:    generateCode('TK'),
        orderId:       order._id,
        userId,
        trainSnapshot: order.trainSnapshot,
        seatSnapshot:  seat,
        passengerSnapshot: {
          fullName:         passenger.fullName         || 'Hanh khach',
          phoneMasked:      passenger.phoneMasked      || '',
          nationalIdMasked: passenger.nationalIdMasked || ''
        },
        ticketStatus: 'issued'
      });
      tickets.push(ticket);
    }

    return res.json({
      success: true,
      data: {
        orderId:    order._id,
        paymentId:  payment._id,
        tickets,
        finalTotal: order.pricing.total
      }
    });
  } catch (error) {
    return next(error);
  }
};

// ─── MoMo handlers ────────────────────────────────────────────────────────────
exports.momoReturn = async (req, res, next) => {
  try {
    const { orderId, resultCode } = req.query || {};
    const clientUrl = process.env.CLIENT_RETURN_URL || '/';

    if (String(resultCode) !== '0') {
      return res.redirect(appendQuery(clientUrl, { status: 'failed', provider: 'momo', orderId }));
    }

    const payment = await Payment.findOne({ providerTxnId: orderId, provider: 'momo' });
    if (!payment) {
      return res.redirect(appendQuery(clientUrl, { status: 'failed', provider: 'momo', orderId }));
    }

    if (payment.status !== 'success') {
      payment.status = 'success';
      payment.paidAt = new Date();
      await payment.save();

      const order = await Order.findById(payment.orderId);
      if (order) {
        order.paymentStatus = 'paid';
        order.orderStatus   = 'paid';
        await order.save();
        await issueTicketsForOrder(order);
      }
    }

    return res.redirect(
      appendQuery(clientUrl, { status: 'success', provider: 'momo', orderId: payment.orderId })
    );
  } catch (error) {
    next(error);
  }
};

exports.momoNotify = async (req, res, next) => {
  try {
    const ok = verifyMoMoSignature(req.body || {});
    if (!ok) return res.status(400).json({ message: 'invalid signature' });

    const { resultCode, orderId } = req.body || {};
    if (String(resultCode) === '0') {
      const payment = await Payment.findOne({ providerTxnId: orderId, provider: 'momo' });
      if (payment && payment.status !== 'success') {
        payment.status = 'success';
        payment.paidAt = new Date();
        await payment.save();

        const order = await Order.findById(payment.orderId);
        if (order) {
          order.paymentStatus = 'paid';
          order.orderStatus   = 'paid';
          await order.save();
          await issueTicketsForOrder(order);
        }
      }
    }

    return res.status(200).json({ message: 'ok' });
  } catch (error) {
    next(error);
  }
};

// ─── ZaloPay handlers ─────────────────────────────────────────────────────────
exports.zaloPayReturn = async (req, res, next) => {
  try {
    const { apptransid, status } = req.query || {};
    const clientUrl = process.env.CLIENT_RETURN_URL || '/';

    if (String(status) !== '1') {
      return res.redirect(
        appendQuery(clientUrl, { status: 'failed', provider: 'zalopay', orderId: apptransid })
      );
    }

    const payment = await Payment.findOne({ providerTxnId: apptransid, provider: 'zalopay' });
    if (!payment) {
      return res.redirect(
        appendQuery(clientUrl, { status: 'failed', provider: 'zalopay', orderId: apptransid })
      );
    }

    if (payment.status !== 'success') {
      payment.status = 'success';
      payment.paidAt = new Date();
      await payment.save();

      const order = await Order.findById(payment.orderId);
      if (order) {
        order.paymentStatus = 'paid';
        order.orderStatus   = 'paid';
        await order.save();
        await issueTicketsForOrder(order);
      }
    }

    return res.redirect(
      appendQuery(clientUrl, { status: 'success', provider: 'zalopay', orderId: payment.orderId })
    );
  } catch (error) {
    next(error);
  }
};

exports.zaloPayCallback = async (req, res, next) => {
  try {
    const { data, mac } = req.body || {};

    if (!data || !mac) {
      return res.json({ return_code: -1, return_message: 'Missing data or mac' });
    }

    const isValid = verifyZaloPayCallback(data, mac);
    if (!isValid) {
      return res.json({ return_code: -1, return_message: 'Invalid signature' });
    }

    const parsed     = JSON.parse(data);
    const appTransId = parsed.app_trans_id;

    const payment = await Payment.findOne({ providerTxnId: appTransId, provider: 'zalopay' });
    if (payment && payment.status !== 'success') {
      payment.status = 'success';
      payment.paidAt = new Date();
      await payment.save();

      const order = await Order.findById(payment.orderId);
      if (order) {
        order.paymentStatus = 'paid';
        order.orderStatus   = 'paid';
        await order.save();
        await issueTicketsForOrder(order);
      }
    }

    // ZaloPay yêu cầu trả về đúng format này
    return res.json({ return_code: 1, return_message: 'success' });
  } catch (error) {
    return res.json({ return_code: 0, return_message: error.message });
  }
};

// ─── Mock checkout handlers ───────────────────────────────────────────────────
exports.mockCheckoutPage = async (req, res, next) => {
  try {
    const { paymentId } = req.query;
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).send('Payment not found');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mock Checkout</title>
  <style>
    body{font-family:Arial,sans-serif;background:#f6f7fb;padding:24px;}
    .card{max-width:420px;margin:0 auto;background:#fff;border-radius:12px;padding:20px;box-shadow:0 6px 18px rgba(0,0,0,0.08)}
    .row{display:flex;justify-content:space-between;margin:8px 0}
    .btn{width:100%;padding:12px;border:none;border-radius:10px;font-weight:700;cursor:pointer}
    .success{background:#22c55e;color:#fff}
    .fail{background:#ef4444;color:#fff;margin-top:10px}
  </style>
</head>
<body>
  <div class="card">
    <h3>Mock Checkout (${payment.provider})</h3>
    <div class="row"><span>Payment ID</span><span>${payment._id}</span></div>
    <div class="row"><span>Order ID</span><span>${payment.orderId}</span></div>
    <div class="row"><span>Amount</span><span>${payment.amount}</span></div>
    <button class="btn success" onclick="location.href='/api/payments/mock-complete?paymentId=${payment._id}&status=success'">Pay Success</button>
    <button class="btn fail"    onclick="location.href='/api/payments/mock-complete?paymentId=${payment._id}&status=failed'">Pay Failed</button>
  </div>
</body>
</html>`;

    res.setHeader('content-type', 'text/html');
    return res.send(html);
  } catch (error) {
    next(error);
  }
};

exports.mockCompletePayment = async (req, res, next) => {
  try {
    const { paymentId, status } = req.query;
    const payment    = await Payment.findById(paymentId);
    const normalized = status === 'success' ? 'success' : 'failed';
    return settlePaymentAndRedirect({ payment, status: normalized, res });
  } catch (error) {
    next(error);
  }
};
