const crypto = require('crypto');
const axios  = require('axios');
const moment = require('moment');

async function createZaloPay({ orderId, amount, returnUrl, callbackUrl }) {
  const appId      = process.env.ZALOPAY_APP_ID;
  const key1       = process.env.ZALOPAY_KEY1;
  const endpoint   = process.env.ZALOPAY_ENDPOINT;

  const appTransId = `${moment().format('YYMMDD')}_${orderId}`;
  const appTime    = Date.now();
  const appUser    = 'vetau_user';
  const embedData  = JSON.stringify({ returnurl: returnUrl });
  const items      = JSON.stringify([]);
  const description = `Thanh toan don hang #${orderId}`;

  // Chuỗi ký đúng thứ tự ZaloPay quy định
  const rawSignature =
    `${appId}|${appTransId}|${appUser}|${amount}|${appTime}|${embedData}|${items}`;

  const mac = crypto
    .createHmac('sha256', key1)
    .update(rawSignature)
    .digest('hex');

  const body = {
    app_id:      Number(appId),
    app_trans_id: appTransId,
    app_user:    appUser,
    app_time:    appTime,
    amount:      Number(amount),
    item:        items,
    embed_data:  embedData,
    description,
    callback_url: callbackUrl,
    mac,
    bank_code:   '',
  };

  const { data } = await axios.post(endpoint, null, { params: body });

  if (data.return_code !== 1) {
    throw new Error(`ZaloPay error ${data.return_code}: ${data.return_message}`);
  }

  return {
    provider:      'zalopay',
    providerTxnId: appTransId,
    amount,
    checkoutUrl:   data.order_url
  };
}

function verifyZaloPayCallback(data, reqMac) {
  const key2 = process.env.ZALOPAY_KEY2;

  const mac = crypto
    .createHmac('sha256', key2)
    .update(data)
    .digest('hex');

  return mac === reqMac;
}

module.exports = { createZaloPay, verifyZaloPayCallback };  