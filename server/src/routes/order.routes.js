const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const { quote, createOrder, getMyOrders } = require('../controllers/order.controller');

router.post('/quote', auth, quote);
router.post('/', auth, createOrder);
router.get('/my', auth, getMyOrders);

module.exports = router;
