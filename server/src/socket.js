const { Server } = require('socket.io');
let io;

function init(server) {
  if (io) return io;
  const origin = process.env.APP_ORIGIN ? process.env.APP_ORIGIN.split(',').map(s => s.trim()) : '*';
  io = new Server(server, {
    cors: {
      origin,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    socket.on('joinTrain', (trainId) => {
      if (trainId) socket.join(`train_${trainId}`);
    });

    socket.on('leaveTrain', (trainId) => {
      if (trainId) socket.leave(`train_${trainId}`);
    });

    socket.on('disconnect', () => {
      // console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized. Call init(server) first.');
  return io;
}

module.exports = { init, getIO };
