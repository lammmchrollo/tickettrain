const Owner = require('../models/owner.model');

exports.listOwners = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const filter = {};
    if (q) filter.$or = [ { name: new RegExp(q, 'i') }, { contactName: new RegExp(q, 'i') }, { phone: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') } ];
    const owners = await Owner.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: owners });
  } catch (error) {
    next(error);
  }
};

exports.createOwner = async (req, res, next) => {
  try {
    const { name, contactName, phone, email, type, address, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Thiếu tên chủ' });
    const o = await Owner.create({ name, contactName, phone, email, type, address, notes, createdBy: req.user?.id });
    res.json({ success: true, data: o });
  } catch (error) {
    next(error);
  }
};

exports.getOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const o = await Owner.findById(id);
    if (!o) return res.status(404).json({ success: false, message: 'Owner not found' });
    res.json({ success: true, data: o });
  } catch (error) {
    next(error);
  }
};

exports.updateOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const o = await Owner.findByIdAndUpdate(id, updates, { new: true });
    res.json({ success: true, data: o });
  } catch (error) {
    next(error);
  }
};
