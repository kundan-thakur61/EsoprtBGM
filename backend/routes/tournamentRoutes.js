const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const {
  createTournament, getTournaments, joinTournament, withdrawTournament,
  uploadScore, getLeaderboard
} = require('../controllers/tournamentController');

router.post('/', auth, createTournament);
router.get('/', getTournaments);
router.post('/:id/join', auth, joinTournament);
router.post('/:id/withdraw', auth, withdrawTournament);
router.post('/:id/score', auth, uploadScore);
router.get('/:id/leaderboard', getLeaderboard);

module.exports = router;