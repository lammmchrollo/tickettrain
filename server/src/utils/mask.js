/**
 * Mask Utilities
 * 
 * Tạo bản hiển thị che bớt (masked) cho dữ liệu PII.
 * Mục đích: hiển thị cho người dùng xác nhận thông tin
 * mà không lộ toàn bộ dữ liệu nhạy cảm.
 * 
 * Nguyên tắc:
 * - Chỉ hiển thị 2-4 ký tự cuối
 * - Phần còn lại thay bằng dấu *
 * - Đủ để người dùng nhận ra thông tin của mình
 * - Không đủ để kẻ tấn công tái tạo dữ liệu gốc
 * 
 * Tham chiếu:
 * - PCI DSS requirement 3.3 (masking PAN display)
 * - GDPR data minimization principle
 */

/**
 * Mask số điện thoại
 * 
 * @param {string} phone — số điện thoại gốc
 * @returns {string} — bản masked
 * 
 * Ví dụ:
 *   maskPhone('0901234567') → '0901****67'
 *   maskPhone('123')        → '******'
 */
function maskPhone(phone = '') {
  if (phone.length < 6) return '******';
  return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
}

/**
 * Mask CCCD / CMND
 * 
 * @param {string} id — số CCCD/CMND gốc
 * @returns {string} — bản masked, chỉ hiển thị 4 số cuối
 * 
 * Ví dụ:
 *   maskNationalId('012345678901') → '********8901'
 *   maskNationalId('123456789')    → '*****6789'
 */
function maskNationalId(id = '') {
  if (id.length < 4) return '****';
  return `${'*'.repeat(Math.max(id.length - 4, 4))}${id.slice(-4)}`;
}

/**
 * Mask họ tên (Fullname)
 * 
 * Giữ nguyên họ (từ đầu tiên), viết tắt các từ giữa,
 * hiển thị 1 ký tự đầu của tên (từ cuối).
 * 
 * @param {string} fullName — họ tên đầy đủ
 * @returns {string} — bản masked
 * 
 * Ví dụ:
 *   maskFullName('Nguyễn Văn An')  → 'Nguyễn V. A.'
 *   maskFullName('Trần Thị Bích')  → 'Trần T. B.'
 *   maskFullName('Lê Hoàng')       → 'Lê H.'
 *   maskFullName('Admin')           → 'A****'
 */
function maskFullName(fullName = '') {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '****';

  if (parts.length === 1) {
    // Tên đơn → chỉ hiện ký tự đầu + ****
    return `${parts[0].charAt(0)}****`;
  }

  // Giữ nguyên họ (từ đầu)
  const lastName = parts[0];
  // Viết tắt các từ còn lại
  const abbreviated = parts.slice(1).map(p => `${p.charAt(0)}.`).join(' ');

  return `${lastName} ${abbreviated}`;
}

/**
 * Mask email
 * 
 * Hiển thị 1-2 ký tự đầu của local part, phần còn lại thay bằng ***
 * Giữ nguyên domain.
 * 
 * @param {string} email — email gốc
 * @returns {string} — bản masked
 * 
 * Ví dụ:
 *   maskEmail('user@example.com')      → 'u***@example.com'
 *   maskEmail('john.doe@gmail.com')    → 'jo***@gmail.com'
 *   maskEmail('ab@test.vn')            → 'a***@test.vn'
 */
function maskEmail(email = '') {
  if (!email || !email.includes('@')) return '***@***.***';

  const [local, domain] = email.split('@');
  if (local.length <= 1) return `${local}***@${domain}`;

  const visible = local.length <= 3 ? 1 : 2;
  return `${local.slice(0, visible)}***@${domain}`;
}

module.exports = { maskPhone, maskNationalId, maskFullName, maskEmail };
