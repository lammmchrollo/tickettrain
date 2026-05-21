const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { JWT_SECRET } = require('../config/env');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Chua dang nhap' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('name email role');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Nguoi dung khong ton tai' });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role || 'customer'
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token khong hop le hoac da het han' });
  }
};

const requireRole = (...allowedRoles) => (req, res, next) => {
  const role = req.user?.role || 'customer';
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ success: false, message: 'Khong co quyen truy cap' });
  }
  next();
};

module.exports = auth;
module.exports.requireRole = requireRole;
