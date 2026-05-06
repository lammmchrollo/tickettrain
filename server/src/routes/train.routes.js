const router = require('express').Router();
const { searchTrains, getTrainSeats } = require('../controllers/train.controller');

router.get('/search', searchTrains);
router.get('/:trainId/seats', getTrainSeats);

module.exports = router;
