const router = require('express').Router();
const { searchTrains, getTrainSeats, createTrain, updateTrain } = require('../controllers/train.controller');

router.get('/search', searchTrains);
router.get('/:trainId/seats', getTrainSeats);

router.post('/', createTrain);
router.put('/:id', updateTrain);

module.exports = router;
