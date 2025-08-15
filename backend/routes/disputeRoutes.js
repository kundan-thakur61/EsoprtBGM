const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const { createDispute, getDisputes, updateDisputeStatus } = require('../controllers/disputeController');

router.post('/', auth, createDispute);
router.get('/', auth, admin, getDisputes);
router.patch('/:id', auth, admin, updateDisputeStatus);

module.exports = router;