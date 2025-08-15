exports.claimDailyReward = async (req, res) => {
  const user = req.user;
  const now = new Date();
  if (user.lastDailyReward && now - user.lastDailyReward < 24 * 60 * 60 * 1000) {
    return res.status(400).json({ message: 'Already claimed today' });
  }
  user.wallet += 10;
  user.lastDailyReward = now;
  await user.save();
  res.json({ message: 'Reward claimed', wallet: user.wallet });
};