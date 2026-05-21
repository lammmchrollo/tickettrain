const router = require('express').Router();
const { searchTrains, getTrainSeats, createTrain, updateTrain, publishTrain, cancelTrain, listOwnerTrains } = require('../controllers/train.controller');
const auth = require('../middlewares/auth.middleware');
const { requireRole } = auth;

router.get('/search', searchTrains);
router.get('/owner/:ownerId', auth, requireRole('admin'), listOwnerTrains);
router.get('/:trainId/seats', getTrainSeats);

router.post('/', auth, requireRole('admin'), createTrain);
router.put('/:id', auth, requireRole('admin'), updateTrain);
router.patch('/:id/publish', auth, requireRole('admin'), publishTrain);
router.patch('/:id/cancel', auth, requireRole('admin'), cancelTrain);

module.exports = router;
