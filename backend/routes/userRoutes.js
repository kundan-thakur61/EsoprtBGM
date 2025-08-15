const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { claimDailyReward } = require('../controllers/userController');

router.post('/daily-reward', auth, claimDailyReward);

module.exports = router;