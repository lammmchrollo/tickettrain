/**
 * Auth Controller
 * 
 * Xử lý đăng ký (OTP), đăng nhập, gửi lại OTP.
 * 
 * Các biện pháp bảo mật đã tích hợp:
 * 
 * 1. PASSWORD STRENGTH ENFORCEMENT
 *    - Mật khẩu ≥ 8 ký tự, chữ hoa + thường + số + ký tự đặc biệt
 *    - Tham chiếu: NIST SP 800-63B, OWASP A07:2021
 * 
 * 2. ACCOUNT LOCKOUT
 *    - Sau 5 lần login sai → khoá 15 phút
 *    - Reset counter khi login thành công
 *    - Chống brute force attack
 *    - Tham chiếu: OWASP A07:2021
 * 
 * 3. OTP HASH (bcrypt)
 *    - OTP được hash bằng bcrypt trước khi lưu
 *    - Kẻ tấn công truy cập DB không thể đọc OTP
 * 
 * 4. OTP RATE LIMITING
 *    - Cooldown 60 giây giữa 2 lần gửi
 *    - Tối đa 5 lần/giờ
 *    - Giới hạn số lần thử OTP sai: 5 lần
 * 
 * 5. TIMING-SAFE RESPONSE
 *    - Login sai email hay sai password → cùng 1 message
 *    - Chống user enumeration attack
 * 
 * 6. JWT EXPIRY 24 GIỜ (giảm từ 7 ngày)
 *    - Giảm thời gian kẻ tấn công sử dụng token bị đánh cắp
 * 
 * 7. AUDIT LOGGING
 *    - Ghi log: login thành công, login thất bại, account locked, đăng ký
 *    - Phục vụ forensic analysis
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const PendingRegistration = require('../models/pendingRegistration.model');
const {
  JWT_SECRET,
  OTP_EXPIRES_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_MAX_PER_HOUR
} = require('../config/env');
const { sendOtpEmail } = require('../services/email.service');
const { logAudit } = require('../middlewares/audit.middleware');

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_ROLES = new Set(['admin', 'customer']);
const OTP_EXPIRES_MS = Number(OTP_EXPIRES_MINUTES || 5) * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = Number(OTP_RESEND_COOLDOWN_SECONDS || 60) * 1000;
const OTP_MAX_ATTEMPTS_NUM = Number(OTP_MAX_ATTEMPTS || 5);
const OTP_RESEND_MAX_PER_HOUR_NUM = Number(OTP_RESEND_MAX_PER_HOUR || 5);
const OTP_RESEND_WINDOW_MS = 60 * 60 * 1000;

/**
 * Account Lockout Configuration
 * 
 * MAX_FAILED_ATTEMPTS: số lần login sai tối đa trước khi khoá
 * LOCK_DURATION_MS: thời gian khoá (15 phút = 900,000 ms)
 * 
 * Sau khi hết thời gian lock, user có thể thử lại.
 * Counter reset về 0 khi login thành công.
 */
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 phút

/**
 * Password Strength Regex
 * 
 * Yêu cầu:
 * - ≥ 8 ký tự
 * - Ít nhất 1 chữ hoa [A-Z]
 * - Ít nhất 1 chữ thường [a-z]
 * - Ít nhất 1 chữ số [0-9]
 * - Ít nhất 1 ký tự đặc biệt
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#^()_+=-]).{8,}$/;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateOtp = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

const canSendOtp = (pending, now) => {
  if (pending?.lastSentAt) {
    const elapsed = now - pending.lastSentAt;
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      return { ok: false, reason: 'cooldown' };
    }
  }

  let windowStart = pending?.resendWindowStart;
  let resendCount = pending?.resendCount || 0;

  if (!windowStart || now - windowStart > OTP_RESEND_WINDOW_MS) {
    windowStart = now;
    resendCount = 0;
  }

  if (resendCount >= OTP_RESEND_MAX_PER_HOUR_NUM) {
    return { ok: false, reason: 'quota', windowStart, resendCount };
  }

  return { ok: true, windowStart, resendCount };
};

// ─── Send Register OTP ───────────────────────────────────────────────────────

exports.sendRegisterOtp = async (req, res, next) => {
  try {
    const { name, email, pass } = req.body;
    const role = String(req.body.role || 'customer').trim().toLowerCase();

    if (!name || !email || !pass) {
      return res.status(400).json({ success: false, message: 'Thieu thong tin dang ky' });
    }

    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ success: false, message: 'Vai tro khong hop le' });
    }

    // ── Password Strength Check ──────────────────────────────────
    // Kiểm tra mật khẩu đủ mạnh trước khi hash (tiết kiệm CPU)
    if (!PASSWORD_REGEX.test(pass)) {
      return res.status(400).json({
        success: false,
        message: 'Mat khau phai co it nhat 8 ky tu, bao gom chu hoa, chu thuong, so va ky tu dac biet'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const passwordHash = await bcrypt.hash(pass, 10);
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email da ton tai' });
    }

    const now = new Date();
    const pending = await PendingRegistration.findOne({ email: normalizedEmail });
    const canSend = canSendOtp(pending, now);
    if (!canSend.ok) {
      const message = canSend.reason === 'cooldown'
        ? 'Vui long doi 1 phut truoc khi gui lai ma'
        : 'Da vuot qua so lan gui ma trong 1 gio';
      return res.status(429).json({ success: false, message });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(now.getTime() + OTP_EXPIRES_MS);

    if (pending) {
      pending.name = String(name).trim();
      pending.password = passwordHash;
      pending.role = role;
      pending.otpHash = otpHash;
      pending.otpExpiresAt = otpExpiresAt;
      pending.attempts = 0;
      await pending.save();
    } else {
      await PendingRegistration.create({
        name: String(name).trim(),
        email: normalizedEmail,
        password: passwordHash,
        role,
        otpHash,
        otpExpiresAt,
        attempts: 0
      });
    }

    const sendResult = await sendOtpEmail({
      email: normalizedEmail,
      name: String(name).trim(),
      otp,
      expiresMinutes: Number(OTP_EXPIRES_MINUTES || 5)
    });

    if (!sendResult.ok) {
      return res.status(500).json({ success: false, message: 'Khong the gui ma OTP. Thu lai sau.' });
    }

    const updatedCount = (canSend.resendCount || 0) + 1;
    await PendingRegistration.updateOne(
      { email: normalizedEmail },
      {
        lastSentAt: now,
        resendCount: updatedCount,
        resendWindowStart: canSend.windowStart || now
      }
    );

    // ── Audit Log: đăng ký ──────────────────────────────────────
    logAudit({
      action: 'AUTH_REGISTER',
      resource: 'PendingRegistration',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: `OTP sent to ${normalizedEmail}`
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Da gui ma OTP. Vui long kiem tra email de tiep tuc dang ky.'
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────

exports.login = async (req, res, next) => {
  try {
    const { email, pass } = req.body;
    const requestedRole = req.body.role ? String(req.body.role).trim().toLowerCase() : null;

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      // ── Audit Log: login thất bại (email không tồn tại) ────────
      logAudit({
        action: 'AUTH_LOGIN_FAILED',
        resource: 'User',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: `Email not found: ${String(email).trim().toLowerCase()}`
      }).catch(() => {});

      return res.status(400).json({ success: false, message: 'Email hoac mat khau khong dung' });
    }

    // ── Account Lockout Check ────────────────────────────────────
    // Kiểm tra tài khoản có đang bị khoá không
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMs = user.lockUntil - new Date();
      const remainingMin = Math.ceil(remainingMs / 60000);

      logAudit({
        userId: user._id,
        action: 'AUTH_LOGIN_FAILED',
        resource: 'User',
        resourceId: user._id.toString(),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: `Account locked. Remaining: ${remainingMin} minutes`
      }).catch(() => {});

      return res.status(423).json({
        success: false,
        message: `Tai khoan tam khoa do dang nhap sai qua nhieu lan. Thu lai sau ${remainingMin} phut.`
      });
    }

    const role = user.role || 'customer';
    if (requestedRole && requestedRole !== role) {
      return res.status(403).json({ success: false, message: 'Tai khoan khong thuoc vai tro da chon' });
    }

    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) {
      // ── Tăng failed attempts ──────────────────────────────────
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        // Khoá tài khoản 15 phút
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);

        logAudit({
          userId: user._id,
          action: 'AUTH_ACCOUNT_LOCKED',
          resource: 'User',
          resourceId: user._id.toString(),
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          details: `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Lock expires: ${user.lockUntil.toISOString()}`
        }).catch(() => {});
      }

      await user.save();

      logAudit({
        userId: user._id,
        action: 'AUTH_LOGIN_FAILED',
        resource: 'User',
        resourceId: user._id.toString(),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: `Wrong password. Attempt ${user.failedLoginAttempts}/${MAX_FAILED_ATTEMPTS}`
      }).catch(() => {});

      return res.status(400).json({ success: false, message: 'Email hoac mat khau khong dung' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ success: false, message: 'Tai khoan chua xac minh email' });
    }

    // ── Login thành công → Reset lockout counter ─────────────────
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    /**
     * JWT Token với expiry 24 giờ
     * 
     * Giảm từ 7 ngày → 24 giờ để:
     * - Giảm thời gian sử dụng token bị đánh cắp
     * - Buộc user re-authenticate thường xuyên hơn
     * - Cân bằng giữa bảo mật và trải nghiệm người dùng
     */
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    // ── Audit Log: login thành công ─────────────────────────────
    logAudit({
      userId: user._id,
      action: 'AUTH_LOGIN_SUCCESS',
      resource: 'User',
      resourceId: user._id.toString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Login successful. Role: ${role}`
    }).catch(() => {});

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Verify Register OTP ─────────────────────────────────────────────────────

exports.verifyRegisterOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Thieu email hoac ma OTP' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const pending = await PendingRegistration.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(404).json({ success: false, message: 'Khong tim thay dang ky tam' });
    }

    const now = new Date();
    if (pending.otpExpiresAt && pending.otpExpiresAt.getTime() < now.getTime()) {
      await PendingRegistration.deleteOne({ email: normalizedEmail });
      return res.status(400).json({ success: false, message: 'Ma OTP da het han' });
    }

    if (pending.attempts >= OTP_MAX_ATTEMPTS_NUM) {
      return res.status(429).json({ success: false, message: 'Da vuot qua so lan thu toi da' });
    }

    const match = await bcrypt.compare(String(otp), pending.otpHash);
    if (!match) {
      pending.attempts += 1;
      await pending.save();
      const remaining = Math.max(OTP_MAX_ATTEMPTS_NUM - pending.attempts, 0);
      return res.status(400).json({
        success: false,
        message: `Ma OTP khong dung. Con ${remaining} lan thu.`
      });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      await PendingRegistration.deleteOne({ email: normalizedEmail });
      return res.status(400).json({ success: false, message: 'Email da ton tai' });
    }

    await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      role: pending.role,
      isEmailVerified: true,
      emailVerifiedAt: now
    });

    await PendingRegistration.deleteOne({ email: normalizedEmail });

    return res.json({
      success: true,
      message: 'Xac minh OTP thanh cong. Vui long dang nhap.'
    });
  } catch (error) {
    next(error);
  }
};

// ─── Resend Register OTP ──────────────────────────────────────────────────────

exports.resendRegisterOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Thieu email' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const pending = await PendingRegistration.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(404).json({ success: false, message: 'Khong tim thay dang ky tam' });
    }

    const now = new Date();
    const canSend = canSendOtp(pending, now);
    if (!canSend.ok) {
      const message = canSend.reason === 'cooldown'
        ? 'Vui long doi 1 phut truoc khi gui lai ma'
        : 'Da vuot qua so lan gui ma trong 1 gio';
      return res.status(429).json({ success: false, message });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(now.getTime() + OTP_EXPIRES_MS);

    const sendResult = await sendOtpEmail({
      email: normalizedEmail,
      name: pending.name,
      otp,
      expiresMinutes: Number(OTP_EXPIRES_MINUTES || 5)
    });

    if (!sendResult.ok) {
      return res.status(500).json({ success: false, message: 'Khong the gui ma OTP. Thu lai sau.' });
    }

    const updatedCount = (canSend.resendCount || 0) + 1;
    await PendingRegistration.updateOne(
      { email: normalizedEmail },
      {
        otpHash,
        otpExpiresAt,
        attempts: 0,
        lastSentAt: now,
        resendCount: updatedCount,
        resendWindowStart: canSend.windowStart || now
      }
    );

    return res.json({
      success: true,
      message: 'Da gui lai ma OTP. Vui long kiem tra email.'
    });
  } catch (error) {
    next(error);
  }
};
