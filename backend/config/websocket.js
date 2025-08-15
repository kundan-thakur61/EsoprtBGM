// backend/config/websocket.js
const socketIo = require('socket.io');

function setupWebSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);

    // Join tournament room
    socket.on('join-tournament', (tournamentId) => {
      socket.join(`tournament-${tournamentId}`);
      console.log(`User ${socket.id} joined tournament ${tournamentId}`);
    });

    // Leave tournament room
    socket.on('leave-tournament', (tournamentId) => {
      socket.leave(`tournament-${tournamentId}`);
      console.log(`User ${socket.id} left tournament ${tournamentId}`);
    });

    // Handle match updates
    socket.on('match-update', (data) => {
      io.to(`tournament-${data.tournamentId}`).emit('match-updated', data);
    });

    // Handle chat messages
    socket.on('chat-message', (data) => {
      io.to(`tournament-${data.tournamentId}`).emit('chat-message', {
        ...data,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('👤 User disconnected:', socket.id);
    });
  });

  // Store io instance globally for use in other parts of the app
  global.io = io;
  
  console.log('✅ WebSocket server initialized');
  return io;
}

module.exports = setupWebSocket;
