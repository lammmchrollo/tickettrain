const Ticket = require('../models/ticket.model');
const { logAudit } = require('../middlewares/audit.middleware');

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

    // ── Audit Log: huỷ vé ──────────────────────────────────────
    logAudit({
      userId: req.user.id,
      action: 'TICKET_CANCELLED',
      resource: 'Ticket',
      resourceId: ticket._id.toString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: `Ticket ${ticketCode} cancelled`
    }).catch(() => {});

    return res.json({
      success: true,
      message: 'Huy ve thanh cong',
      data: ticket
    });
  } catch (error) {
    return next(error);
  }
};
