const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { register, login, setup2FA, verify2FA } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/2fa/setup', auth, setup2FA);
router.post('/2fa/verify', auth, verify2FA);

module.exports = router;