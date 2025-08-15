const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Mapping from userId to their socket(s)
const userSockets = {};

function setupWebsocket(io) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('No token provided'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));
      socket.user = user; // Attach user to socket
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    // Save mapping userId -> socket(s)
    if (!userSockets[userId]) userSockets[userId] = [];
    userSockets[userId].push(socket);

    socket.on('disconnect', () => {
      // Clean up on disconnect
      userSockets[userId] = userSockets[userId].filter(s => s !== socket);
      if (userSockets[userId].length === 0) delete userSockets[userId];
    });

    // Optionally: listen for other client events here
  });

  // Helper for outside modules to emit to user
  io.sendNotificationToUser = (userId, data) => {
    (userSockets[userId] || []).forEach(sock => sock.emit('notification', data));
  };
}

module.exports = { setupWebsocket };
