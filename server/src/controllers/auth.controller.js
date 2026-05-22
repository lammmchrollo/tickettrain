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

const ALLOWED_ROLES = new Set(['admin', 'customer']);
const OTP_EXPIRES_MS = Number(OTP_EXPIRES_MINUTES || 5) * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = Number(OTP_RESEND_COOLDOWN_SECONDS || 60) * 1000;
const OTP_MAX_ATTEMPTS_NUM = Number(OTP_MAX_ATTEMPTS || 5);
const OTP_RESEND_MAX_PER_HOUR_NUM = Number(OTP_RESEND_MAX_PER_HOUR || 5);
const OTP_RESEND_WINDOW_MS = 60 * 60 * 1000;

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

    res.json({
      success: true,
      message: 'Da gui ma OTP. Vui long kiem tra email de tiep tuc dang ky.'
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, pass } = req.body;
    const requestedRole = req.body.role ? String(req.body.role).trim().toLowerCase() : null;

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Email hoac mat khau khong dung' });
    }

    const role = user.role || 'customer';
    if (requestedRole && requestedRole !== role) {
      return res.status(403).json({ success: false, message: 'Tai khoan khong thuoc vai tro da chon' });
    }

    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) {
      return res.status(400).json({ success: false, message: 'Email hoac mat khau khong dung' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ success: false, message: 'Tai khoan chua xac minh email' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role }
    });
  } catch (error) {
    next(error);
  }
};

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
