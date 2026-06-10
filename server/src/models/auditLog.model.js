/**
 * Audit Log Model
 * 
 * Ghi lại tất cả thao tác nhạy cảm trong hệ thống phục vụ:
 * - Truy vết hành vi bất thường (forensic analysis)
 * - Phát hiện tấn công (intrusion detection)
 * - Tuân thủ quy định bảo mật (compliance)
 * 
 * Các sự kiện được ghi log:
 * - AUTH_LOGIN_SUCCESS / AUTH_LOGIN_FAILED — đăng nhập thành công/thất bại
 * - AUTH_REGISTER — đăng ký tài khoản
 * - AUTH_ACCOUNT_LOCKED — tài khoản bị khoá do login sai nhiều lần
 * - ORDER_CREATED — tạo đơn hàng
 * - PAYMENT_CREATED / PAYMENT_SUCCESS — tạo/hoàn thành thanh toán
 * - TICKET_CANCELLED — huỷ vé
 * - ADMIN_ACCESS — truy cập route admin
 * 
 * TTL Index:
 * - Logs tự động xoá sau 90 ngày (tiết kiệm storage)
 * - MongoDB TTL index chạy background mỗi 60 giây
 * 
 * Tham chiếu OWASP:
 * - A09:2021 – Security Logging and Monitoring Failures
 */

const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  // ID người dùng thực hiện thao tác (null nếu chưa đăng nhập)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Loại hành động (enum string)
  action: {
    type: String,
    required: true,
    enum: [
      'AUTH_LOGIN_SUCCESS',
      'AUTH_LOGIN_FAILED',
      'AUTH_REGISTER',
      'AUTH_ACCOUNT_LOCKED',
      'ORDER_CREATED',
      'PAYMENT_CREATED',
      'PAYMENT_SUCCESS',
      'TICKET_CANCELLED',
      'ADMIN_ACCESS'
    ]
  },

  // Tài nguyên bị tác động (tên collection hoặc endpoint)
  resource: {
    type: String,
    default: ''
  },

  // ID của tài nguyên bị tác động
  resourceId: {
    type: String,
    default: ''
  },

  // Địa chỉ IP của client
  ip: {
    type: String,
    default: ''
  },

  // User-Agent header (nhận diện trình duyệt/thiết bị)
  userAgent: {
    type: String,
    default: ''
  },

  // Chi tiết bổ sung (reason, email, v.v.)
  details: {
    type: String,
    default: ''
  },

  // Thời điểm ghi log
  timestamp: {
    type: Date,
    default: Date.now
  }
});

/**
 * TTL Index — tự động xoá document sau 90 ngày
 * 
 * Cách hoạt động:
 * - MongoDB chạy background thread kiểm tra TTL index mỗi 60 giây
 * - Khi field `timestamp` + 90 ngày < thời điểm hiện tại → document bị xoá
 * - Giúp kiểm soát kích thước collection tự động
 */
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Index cho truy vấn theo userId và action (tìm kiếm log nhanh)
AuditLogSchema.index({ userId: 1, action: 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
