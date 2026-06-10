/**
 * Input Validator Middleware
 * 
 * Kiểm tra dữ liệu đầu vào tại tầng middleware trước khi đến controller.
 * Tự viết bằng regex thuần — không dùng thư viện ngoài (express-validator).
 * 
 * Mục đích:
 * - Đảm bảo dữ liệu đúng format trước khi xử lý
 * - Chặn sớm các request không hợp lệ (fail-fast)
 * - Giảm tải cho controller và database
 * 
 * Patterns bảo vệ:
 * - Email format validation (RFC 5322 simplified)
 * - Password strength enforcement (NIST SP 800-63B inspired)
 * - Phone number format (Việt Nam: 10-11 chữ số)
 * - National ID format (CCCD: 12 số, CMND: 9 số)
 * - Name length limits (chống buffer overflow / abuse)
 * 
 * Tham chiếu OWASP:
 * - A03:2021 – Injection (ngăn dữ liệu bất thường)
 * - A04:2021 – Insecure Design (validate trước khi xử lý)
 */

// ─── Regex Patterns ──────────────────────────────────────────────────────────

/**
 * Email regex (simplified RFC 5322)
 * - Cho phép chữ, số, dấu chấm, gạch dưới, gạch ngang trước @
 * - Domain phải có ít nhất 1 dấu chấm
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Password strength regex
 * Yêu cầu tối thiểu:
 * - 8 ký tự trở lên
 * - Ít nhất 1 chữ cái viết hoa [A-Z]
 * - Ít nhất 1 chữ cái viết thường [a-z]
 * - Ít nhất 1 chữ số [0-9]
 * - Ít nhất 1 ký tự đặc biệt [@$!%*?&.#^()_+=-]
 * 
 * Tham khảo NIST SP 800-63B:
 * - Mật khẩu nên ≥ 8 ký tự
 * - Kết hợp nhiều loại ký tự tăng entropy
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#^()_+=-]).{8,}$/;

/**
 * Phone number regex (Việt Nam)
 * - 10-11 chữ số
 * - Có thể bắt đầu bằng 0 hoặc +84
 */
const PHONE_REGEX = /^(\+84|0)\d{9,10}$/;

/**
 * National ID regex (CCCD 12 số hoặc CMND 9 số)
 */
const NATIONAL_ID_REGEX = /^\d{9}$|^\d{12}$/;

// ─── Helper ─────────────────────────────────────────────────────────────────

/**
 * Tạo error response thống nhất cho validation failure
 */
function validationError(res, message) {
  return res.status(400).json({ success: false, message });
}

// ─── Validators ──────────────────────────────────────────────────────────────

/**
 * Validate đăng ký: name, email, password
 * 
 * Rules:
 * - name: 2-50 ký tự, không rỗng
 * - email: đúng format RFC 5322
 * - pass: ≥ 8 ký tự, có chữ hoa + thường + số + đặc biệt
 */
function validateRegister(req, res, next) {
  const { name, email, pass } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
    return validationError(res, 'Ten phai tu 2-50 ky tu');
  }

  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    return validationError(res, 'Email khong dung dinh dang');
  }

  if (!pass || !PASSWORD_REGEX.test(pass)) {
    return validationError(res, 
      'Mat khau phai co it nhat 8 ky tu, bao gom chu hoa, chu thuong, so va ky tu dac biet (@$!%*?&.#)'
    );
  }

  next();
}

/**
 * Validate đăng nhập: email, password
 */
function validateLogin(req, res, next) {
  const { email, pass } = req.body;

  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    return validationError(res, 'Email khong dung dinh dang');
  }

  if (!pass || typeof pass !== 'string' || pass.length < 1) {
    return validationError(res, 'Thieu mat khau');
  }

  next();
}

/**
 * Validate thông tin hành khách khi tạo đơn hàng
 * 
 * Kiểm tra từng passenger trong mảng:
 * - fullName: 2-50 ký tự
 * - phone: 10-11 số (format Việt Nam)
 * - nationalId: 9 hoặc 12 số (CMND hoặc CCCD)
 */
function validatePassengers(req, res, next) {
  const { passengers } = req.body;

  if (!Array.isArray(passengers) || passengers.length === 0) {
    return validationError(res, 'Thieu thong tin hanh khach');
  }

  for (let i = 0; i < passengers.length; i++) {
    const p = passengers[i];
    const idx = i + 1;

    const fullName = p.fullName || p.name || '';
    if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 50) {
      return validationError(res, `Hanh khach ${idx}: Ten phai tu 2-50 ky tu`);
    }

    const phone = String(p.phone || '').trim();
    if (!PHONE_REGEX.test(phone)) {
      return validationError(res, `Hanh khach ${idx}: So dien thoai khong hop le (10-11 so, bat dau bang 0 hoac +84)`);
    }

    const nationalId = String(p.idCard || p.nationalId || '').trim();
    if (!NATIONAL_ID_REGEX.test(nationalId)) {
      return validationError(res, `Hanh khach ${idx}: CCCD/CMND khong hop le (9 hoac 12 so)`);
    }
  }

  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validatePassengers
};
