const dotenv = require('dotenv');
const crypto = require('crypto');
const { URL } = require('url');

dotenv.config({ path: 'server/.env' });

const url = process.argv[2];
if (!url) {
  console.error('Missing URL argument.');
  process.exit(1);
}

const q = new URL(url).searchParams;
const data = {};
for (const [k, v] of q) {
  data[k] = v;
}

const secret = process.env.VNPAY_HASH_SECRET || '';
const vnp_SecureHash = data.vnp_SecureHash || '';

delete data.vnp_SecureHash;
const encode = (value) => encodeURIComponent(String(value)).replace(/%20/g, '+');
const sorted = Object.keys(data).sort();
const signData = sorted.map((k) => `${encode(k)}=${encode(data[k])}`).join('&');
const hmac = crypto.createHmac('sha512', secret).update(signData).digest('hex');

console.log('match', hmac === vnp_SecureHash);
console.log('hmac', hmac);
