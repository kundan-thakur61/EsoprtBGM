const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketio = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'));

app.get('/', (req, res) => res.send('API Running'));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tournaments', require('./routes/tournamentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/disputes', require('./routes/disputeRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = swaggerJsdoc({
  definition: { openapi: '3.0.0', info: { title: 'eSports API', version: '1.0.0' } },
  apis: ['./routes/*.js']
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Socket.io example
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('joinTournament', (data) => {
    socket.join(data.tournamentId);
    io.to(data.tournamentId).emit('userJoined', { userId: data.userId });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));