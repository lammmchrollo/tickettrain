const Ticket = require('../models/ticket.model');

exports.getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
};

exports.getTicketDetail = async (req, res, next) => {
  try {
    const { ticketCode } = req.params;
    const ticket = await Ticket.findOne({
      ticketCode,
      userId: req.user.id
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Khong tim thay ve' });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

exports.cancelTicket = async (req, res, next) => {
  try {
    const { ticketCode } = req.params;

    const ticket = await Ticket.findOne({
      ticketCode,
      userId: req.user.id
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Khong tim thay ve' });
    }

    if (ticket.ticketStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Ve da o trang thai huy' });
    }

    if (ticket.ticketStatus === 'used') {
      return res.status(400).json({ success: false, message: 'Khong the huy ve da su dung' });
    }

    ticket.ticketStatus = 'cancelled';
    await ticket.save();

    return res.json({
      success: true,
      message: 'Huy ve thanh cong',
      data: ticket
    });
  } catch (error) {
    return next(error);
  }
};
