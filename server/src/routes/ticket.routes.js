const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const {
	getMyTickets,
	getTicketDetail,
	cancelTicket
} = require('../controllers/ticket.controller');

router.get('/my', auth, getMyTickets);
router.get('/:ticketCode', auth, getTicketDetail);
router.post('/:ticketCode/cancel', auth, cancelTicket);

module.exports = router;
