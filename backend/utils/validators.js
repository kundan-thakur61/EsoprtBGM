exports.isEmail = (email) => {
  return /\S+@\S+\.\S+/.test(email);
};

exports.validatePlayerNames = (players) => {
  return Array.isArray(players) && players.length === 4 && players.every(p => typeof p === 'string' && p.length);
};
