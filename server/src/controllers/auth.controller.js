const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { JWT_SECRET } = require('../config/env');

const ALLOWED_ROLES = new Set(['admin', 'customer']);

exports.register = async (req, res, next) => {
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
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email da ton tai' });
    }

    const passwordHash = await bcrypt.hash(pass, 10);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: passwordHash,
      role
    });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
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
