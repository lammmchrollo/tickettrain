const crypto = require('crypto');

const encodeString = (value) => encodeURIComponent(String(value)).replace(/%20/g, '+');

const buildVnPayUrl = ({ params, vnpUrl, secret }) => {
  const sortedKeys = Object.keys(params).sort();
  const signKeys = sortedKeys.filter((k) => k !== 'vnp_SecureHash');
  // VNPay signing uses URL-encoded values with '+' for spaces.
  const signData = signKeys
    .map((k) => `${encodeString(k)}=${encodeString(params[k])}`)
    .join('&');
  const hmac = crypto.createHmac('sha512', secret).update(signData).digest('hex');
  const qs = sortedKeys.map((k) => `${encodeString(k)}=${encodeString(params[k])}`).join('&');
  return `${vnpUrl}?${qs}&vnp_SecureHash=${hmac}`;
};

async function createVnPay({ orderId, amount, returnUrl, ipAddr }) {
  const vnp_TmnCode = process.env.VNPAY_TMN_CODE || '';
  const vnp_HashSecret = process.env.VNPAY_HASH_SECRET || '';
  const vnp_Url = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const vnp_ExpireMinutes = Number(process.env.VNPAY_EXPIRE_MINUTES || 15);

  const tmn = vnp_TmnCode;
  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const createDate = vnTime.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const orderInfo = `Thanh toan don ${orderId}`;
  const amountVnd = String(Math.round(amount) * 100);
  const expireDate = new Date(vnTime.getTime() + vnp_ExpireMinutes * 60000)
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14);
  const ip = ipAddr || '127.0.0.1';

  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_SecureHashType: 'HmacSHA512',
    vnp_TmnCode: tmn,
    vnp_Amount: amountVnd,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: String(orderId),
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ip,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate
  };

  const checkoutUrl = buildVnPayUrl({ params, vnpUrl: vnp_Url, secret: vnp_HashSecret });

  return {
    provider: 'vnpay',
    providerTxnId: params.vnp_TxnRef,
    amount,
    checkoutUrl
  };
}

function verifyVnPaySignature(query) {
  const secret = process.env.VNPAY_HASH_SECRET || '';
  const vnp_SecureHash = query.vnp_SecureHash || query.vnp_SecureHashValue || '';
  const data = { ...query };
  delete data.vnp_SecureHash;
  delete data.vnp_SecureHashType;
  const sortedKeys = Object.keys(data).sort();
  const signData = sortedKeys
    .map((k) => `${encodeString(k)}=${encodeString(data[k])}`)
    .join('&');
  const hmac = crypto.createHmac('sha512', secret).update(signData).digest('hex');
  return hmac === vnp_SecureHash;
}

module.exports = { createVnPay, verifyVnPaySignature };
