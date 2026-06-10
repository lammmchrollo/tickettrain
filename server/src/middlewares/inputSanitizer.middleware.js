/**
 * Input Sanitizer Middleware
 * 
 * Bảo vệ chống 2 loại tấn công:
 * 1. NoSQL Injection — loại bỏ MongoDB operators ($gt, $regex, $where...) khỏi input
 * 2. Stored XSS — escape ký tự HTML đặc biệt (<, >, &, ", ')
 * 
 * Hoạt động:
 * - Duyệt đệ quy (recursive) qua tất cả keys/values trong req.body, req.query, req.params
 * - Nếu key bắt đầu bằng '$' → xoá key đó (chống NoSQL operator injection)
 * - Nếu value là string → escape HTML entities (chống XSS)
 * - Nếu value là object/array → đệ quy tiếp vào bên trong
 * 
 * Vị trí trong middleware stack: sau express.json(), trước tất cả route handlers
 * 
 * Tham chiếu OWASP:
 * - A03:2021 – Injection
 * - A07:2021 – Cross-Site Scripting (XSS)
 */

// Danh sách MongoDB operators nguy hiểm cần loại bỏ
const MONGO_OPERATORS = new Set([
  '$gt', '$gte', '$lt', '$lte', '$ne', '$nin', '$in',
  '$regex', '$options', '$where', '$exists', '$type',
  '$expr', '$jsonSchema', '$mod', '$text', '$search',
  '$all', '$elemMatch', '$size', '$slice',
  '$set', '$unset', '$inc', '$push', '$pull',
  '$and', '$or', '$not', '$nor'
]);

/**
 * Escape HTML entities để chống Stored XSS
 * Thay thế 5 ký tự đặc biệt bằng HTML entities tương ứng
 * 
 * @param {string} str — chuỗi cần escape
 * @returns {string} — chuỗi đã escape
 * 
 * Ví dụ:
 *   escapeHtml('<script>alert("xss")</script>')
 *   → '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize đệ quy một object — loại bỏ MongoDB operators và escape HTML
 * 
 * Thuật toán:
 * 1. Nếu input là string → escape HTML entities
 * 2. Nếu input là array → sanitize từng phần tử
 * 3. Nếu input là object → duyệt từng key:
 *    a. Key bắt đầu bằng '$' → bỏ qua (không copy vào kết quả)
 *    b. Key bình thường → đệ quy sanitize value
 * 4. Các kiểu khác (number, boolean, null) → giữ nguyên
 * 
 * @param {*} obj — dữ liệu cần sanitize
 * @returns {*} — dữ liệu đã được sanitize
 */
function sanitize(obj) {
  if (typeof obj === 'string') {
    return escapeHtml(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  if (obj !== null && typeof obj === 'object') {
    const clean = {};
    for (const key of Object.keys(obj)) {
      // Loại bỏ tất cả keys bắt đầu bằng '$' — chống NoSQL injection
      if (key.startsWith('$')) {
        // Log cảnh báo khi phát hiện operator injection attempt
        console.warn(`[InputSanitizer] Blocked MongoDB operator: "${key}"`);
        continue;
      }
      clean[key] = sanitize(obj[key]);
    }
    return clean;
  }

  // number, boolean, null, undefined → giữ nguyên
  return obj;
}

/**
 * Express middleware: sanitize req.body, req.query, req.params
 * 
 * Áp dụng global trước tất cả route handlers
 * Đảm bảo mọi dữ liệu đầu vào đều được làm sạch trước khi
 * đến tầng controller/service
 */
function inputSanitizer(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitize(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitize(req.params);
  }
  next();
}

module.exports = inputSanitizer;
