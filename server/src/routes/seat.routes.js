const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const { holdSeats } = require('../controllers/seat.controller');

router.post('/hold', auth, holdSeats);

module.exports = router;
