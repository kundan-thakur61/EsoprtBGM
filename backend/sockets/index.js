const socketio = require('socket.io');
const { setupWebsocket } = require('../services/websocket');

module.exports = (server) => {
  const io = socketio(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });
  setupWebsocket(io);
};
