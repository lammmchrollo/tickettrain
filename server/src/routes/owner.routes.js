const router = require('express').Router();
const { listOwners, createOwner, getOwner, updateOwner } = require('../controllers/owner.controller');

router.get('/', listOwners);
router.post('/', createOwner);
router.get('/:id', getOwner);
router.put('/:id', updateOwner);

module.exports = router;
