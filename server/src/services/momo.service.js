const axios = require('axios');
const crypto = require('crypto');

const signHmacSha256 = (raw, secret) => crypto.createHmac('sha256', secret).update(raw).digest('hex');

async function createMoMo({ orderId, amount, returnUrl, notifyUrl }) {
  const partnerCode = process.env.MOMO_PARTNER_CODE || '';
  const accessKey = process.env.MOMO_ACCESS_KEY || '';
  const secretKey = process.env.MOMO_SECRET_KEY || '';
  const endpoint = process.env.MOMO_ENDPOINT || '';

  const requestType = 'captureWallet';
  const requestId = `${partnerCode}-${Date.now()}`;
  const momoOrderId = requestId;
  const orderInfo = `Thanh toan don ${orderId}`;
  const extraData = '';
  const amountValue = String(amount);

  const rawSignature = `accessKey=${accessKey}&amount=${amountValue}&extraData=${extraData}&ipnUrl=${notifyUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;
  const signature = signHmacSha256(rawSignature, secretKey);

  const payload = {
    partnerCode,
    accessKey,
    requestId,
    amount: amountValue,
    orderId: momoOrderId,
    orderInfo,
    redirectUrl: returnUrl,
    ipnUrl: notifyUrl,
    extraData,
    requestType,
    signature
  };

  let data;
  try {
    ({ data } = await axios.post(endpoint, payload, {
      headers: { 'Content-Type': 'application/json' }
    }));
  } catch (err) {
    const momoData = err.response?.data;
    const reason = momoData?.message || momoData?.resultMessage || err.message;
    const momoError = new Error(`MoMo create failed: ${reason}`);
    momoError.status = 400;
    momoError.meta = momoData;
    throw momoError;
  }

  if (Number(data?.resultCode) !== 0) {
    const reason = data?.message || data?.resultMessage || 'MoMo payment failed';
    const momoError = new Error(`MoMo create failed: ${reason}`);
    momoError.status = 400;
    momoError.meta = data;
    throw momoError;
  }

  return {
    provider: 'momo',
    providerTxnId: requestId,
    amount,
    checkoutUrl: data?.payUrl
  };
}

const pickValue = (value) => (value === undefined || value === null ? '' : String(value));

function verifyMoMoSignature(body = {}) {
  const accessKey = process.env.MOMO_ACCESS_KEY || '';
  const secretKey = process.env.MOMO_SECRET_KEY || '';

  const rawSignature = `accessKey=${accessKey}&amount=${pickValue(body.amount)}&extraData=${pickValue(body.extraData)}&message=${pickValue(body.message)}&orderId=${pickValue(body.orderId)}&orderInfo=${pickValue(body.orderInfo)}&orderType=${pickValue(body.orderType)}&partnerCode=${pickValue(body.partnerCode)}&payType=${pickValue(body.payType)}&requestId=${pickValue(body.requestId)}&responseTime=${pickValue(body.responseTime)}&resultCode=${pickValue(body.resultCode)}&transId=${pickValue(body.transId)}`;
  const signature = signHmacSha256(rawSignature, secretKey);

  return signature === body.signature;
}

module.exports = { createMoMo, verifyMoMoSignature };
