/**
 * Audit Logging Middleware
 * 
 * Ghi lại các thao tác nhạy cảm vào collection AuditLog.
 * Thiết kế fire-and-forget: không block request, không throw error.
 * 
 * Cách sử dụng:
 *   const { logAudit } = require('./middlewares/audit.middleware');
 * 
 *   // Gọi trực tiếp trong controller:
 *   await logAudit({
 *     userId: req.user?.id,
 *     action: 'AUTH_LOGIN_SUCCESS',
 *     resource: 'User',
 *     resourceId: user._id,
 *     ip: req.ip,
 *     userAgent: req.headers['user-agent'],
 *     details: 'Login successful'
 *   });
 * 
 * Nguyên tắc thiết kế:
 * - Non-blocking: dùng .catch() để không ảnh hưởng luồng chính
 * - Defensive: try/catch tất cả, không để audit lỗi crash server
 * - Minimal data: chỉ lưu thông tin cần thiết cho forensic
 * 
 * Tham chiếu OWASP:
 * - A09:2021 – Security Logging and Monitoring Failures
 */

const AuditLog = require('../models/auditLog.model');

/**
 * Ghi một entry audit log
 * 
 * @param {Object} params
 * @param {string} [params.userId] — ID người dùng (null nếu chưa login)
 * @param {string} params.action — Loại hành động (AUTH_LOGIN_SUCCESS, etc.)
 * @param {string} [params.resource] — Tài nguyên bị tác động
 * @param {string} [params.resourceId] — ID tài nguyên
 * @param {string} [params.ip] — IP address
 * @param {string} [params.userAgent] — User-Agent header
 * @param {string} [params.details] — Chi tiết bổ sung
 * 
 * @returns {Promise<void>}
 */
async function logAudit({ userId, action, resource, resourceId, ip, userAgent, details }) {
  try {
    await AuditLog.create({
      userId: userId || null,
      action,
      resource: resource || '',
      resourceId: resourceId || '',
      ip: ip || '',
      userAgent: userAgent || '',
      details: details || ''
    });
  } catch (err) {
    // Fire-and-forget: log lỗi nhưng KHÔNG throw
    // Đảm bảo audit failure không ảnh hưởng đến luồng nghiệp vụ chính
    console.error('[AuditLog] Failed to write audit log:', err.message);
  }
}

/**
 * Express middleware factory cho audit logging
 * 
 * Sử dụng khi muốn tự động log cho mọi request đi qua route:
 *   router.use('/admin', auditMiddleware('ADMIN_ACCESS', 'AdminPanel'));
 * 
 * @param {string} action — Loại hành động
 * @param {string} resource — Tài nguyên
 * @returns {Function} Express middleware
 */
function auditMiddleware(action, resource) {
  return (req, res, next) => {
    // Fire-and-forget: ghi log nhưng không chờ
    logAudit({
      userId: req.user?.id,
      action,
      resource,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: `${req.method} ${req.originalUrl}`
    }).catch(() => {});

    next();
  };
}

module.exports = { logAudit, auditMiddleware };
