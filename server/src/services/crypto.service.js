const crypto = require('crypto');
const { DATA_ENCRYPTION_KEY } = require('../config/env');

if (!DATA_ENCRYPTION_KEY || DATA_ENCRYPTION_KEY.length !== 64) {
  console.warn('DATA_ENCRYPTION_KEY must be 64 hex chars');
}

const KEY = Buffer.from(DATA_ENCRYPTION_KEY || '0'.repeat(64), 'hex');

function encryptText(plainText) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plainText), 'utf8'),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
    tag: tag.toString('hex')
  };
}

function decryptText(payload) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    KEY,
    Buffer.from(payload.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.content, 'hex')),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

module.exports = { encryptText, decryptText };
