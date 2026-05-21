const router = require('express').Router();
const { searchTrains, getTrainSeats, createTrain, updateTrain, publishTrain, cancelTrain, listOwnerTrains } = require('../controllers/train.controller');

router.get('/search', searchTrains);
router.get('/owner/:ownerId', listOwnerTrains);
router.get('/:trainId/seats', getTrainSeats);

router.post('/', createTrain);
router.put('/:id', updateTrain);
router.patch('/:id/publish', publishTrain);
router.patch('/:id/cancel', cancelTrain);

module.exports = router;
