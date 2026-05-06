const Promotion = require('../models/promotion.model');

function calculateServiceFee(subtotal) {
  return Math.round(subtotal * 0.02);
}

async function calculatePricing({ seats, promoCode }) {
  const subtotal = seats.reduce((sum, s) => sum + (s.basePrice || 0), 0);
  const serviceFee = calculateServiceFee(subtotal);

  let discount = 0;
  let promotion = null;

  if (promoCode) {
    const now = new Date();
    promotion = await Promotion.findOne({
      code: promoCode.toUpperCase(),
      isActive: true,
      startAt: { $lte: now },
      endAt: { $gte: now }
    });

    if (promotion) {
      if (subtotal >= (promotion.minOrderValue || 0)) {
        if (promotion.type === 'percent') {
          discount = Math.round((subtotal * promotion.value) / 100);
          if (promotion.maxDiscount) {
            discount = Math.min(discount, promotion.maxDiscount);
          }
        } else if (promotion.type === 'fixed') {
          discount = promotion.value;
        }
      }
    }
  }

  const total = Math.max(subtotal + serviceFee - discount, 0);

  return {
    subtotal,
    serviceFee,
    discount,
    total,
    promotion: promotion
      ? {
          code: promotion.code,
          type: promotion.type,
          value: promotion.value
        }
      : null
  };
}

module.exports = { calculatePricing };
