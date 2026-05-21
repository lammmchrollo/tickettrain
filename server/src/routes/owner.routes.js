const router = require('express').Router();
const { listOwners, createOwner, getOwner, updateOwner } = require('../controllers/owner.controller');
const auth = require('../middlewares/auth.middleware');
const { requireRole } = auth;

router.get('/', auth, requireRole('admin'), listOwners);
router.post('/', auth, requireRole('admin'), createOwner);
router.get('/:id', auth, requireRole('admin'), getOwner);
router.put('/:id', auth, requireRole('admin'), updateOwner);

module.exports = router;
