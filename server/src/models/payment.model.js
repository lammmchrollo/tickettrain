const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    provider: { type: String, required: true, default: 'mockpay' },
    providerTxnId: { type: String, required: true },
    amount: { type: Number, required: true },
    checkoutUrl: { type: String, default: null },
    status: {
      type: String,
      enum: ['initiated', 'pending', 'success', 'failed', 'cancelled'],
      default: 'initiated'
    },
    paidAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);
