const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const { getUsers, getTournaments, getStats } = require('../controllers/adminController');

router.get('/users', auth, admin, getUsers);
router.get('/tournaments', auth, admin, getTournaments);
router.get('/stats', auth, admin, getStats);

module.exports = router;