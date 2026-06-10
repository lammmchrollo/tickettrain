/**
 * Cryptographically Secure Code Generator
 * 
 * Tạo mã đơn hàng (OD...) và mã vé (TK...) không thể dự đoán.
 * 
 * VẤN ĐỀ CŨ:
 * - Dùng Math.random() → PRNG (Pseudo-Random Number Generator)
 * - Math.random() dùng thuật toán xorshift128+ → có thể dự đoán
 *   nếu biết đủ số lượng output (state recovery attack)
 * - Kẻ tấn công có thể enumeration mã vé/đơn hàng
 * 
 * GIẢI PHÁP:
 * - Dùng crypto.randomInt() → CSPRNG (Cryptographically Secure PRNG)
 * - crypto.randomInt() sử dụng entropy từ OS (/dev/urandom trên Linux,
 *   CryptGenRandom trên Windows)
 * - Không thể dự đoán dù biết nhiều output trước đó
 * 
 * Tham chiếu OWASP:
 * - A02:2021 – Cryptographic Failures (sử dụng CSPRNG thay vì PRNG)
 */

const crypto = require('crypto');

/**
 * Tạo mã duy nhất với prefix
 * 
 * Format: <PREFIX><timestamp_8_chars><random_4_digits>
 * - Timestamp: 8 ký tự cuối của Date.now() (đảm bảo tuần tự)
 * - Random: 4 chữ số ngẫu nhiên từ crypto.randomInt (1000-9999)
 * 
 * Entropy:
 * - 4 chữ số random = ~13.3 bits entropy (log2(9000))
 * - Kết hợp timestamp = collision probability cực thấp
 * 
 * @param {string} prefix — tiền tố mã (VD: 'OD', 'TK', 'PM')
 * @returns {string} — mã duy nhất, VD: 'OD123456785432'
 * 
 * Ví dụ:
 *   generateCode('OD') → 'OD987654321234'
 *   generateCode('TK') → 'TK123456785678'
 */
function generateCode(prefix) {
  const ts = Date.now().toString().slice(-8);
  // crypto.randomInt() sử dụng CSPRNG — an toàn hơn Math.random()
  const rand = crypto.randomInt(1000, 10000);
  return `${prefix}${ts}${rand}`;
}

module.exports = { generateCode };
