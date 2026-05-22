const nodemailer = require('nodemailer');
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  EMAIL_FROM
} = require('../config/env');

const buildTransporter = () => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: String(SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
};

const sendOtpEmail = async ({ email, name, otp, expiresMinutes }) => {
  const transporter = buildTransporter();
  if (!transporter) {
    console.warn('SMTP config missing. Skipping OTP email.');
    return { ok: false, error: 'missing_smtp_config' };
  }

  const safeName = name ? String(name).trim() : 'ban';
  const subject = 'Ma OTP xac minh dang ky Ve Tau';
  const ttlText = expiresMinutes ? `${expiresMinutes} phut` : 'mot khoang thoi gian ngan';
  const text = `Chao ${safeName},\n\nMa OTP de hoan tat dang ky cua ban la: ${otp}\nMa co hieu luc trong ${ttlText}.\n\nNeu ban khong dang ky tai khoan, hay bo qua email nay.`;
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ma OTP dang ky</title>
  </head>
  <body style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;margin:0;padding:24px;color:#111827;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;box-shadow:0 8px 20px rgba(0,0,0,0.08);">
      <h2 style="margin:0 0 12px 0;font-size:20px;">Chao ${safeName},</h2>
      <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;">Ma OTP de hoan tat dang ky cua ban:</p>
      <div style="font-size:28px;font-weight:800;letter-spacing:6px;color:#2563eb;margin-bottom:16px;">${otp}</div>
      <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">Ma co hieu luc trong ${ttlText}. Neu ban khong dang ky tai khoan, hay bo qua email nay.</p>
    </div>
  </body>
</html>`;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject,
      text,
      html
    });
    return { ok: true };
  } catch (error) {
    console.error('Send OTP email error:', error.message);
    return { ok: false, error: error.message };
  }
};

module.exports = { sendOtpEmail };
