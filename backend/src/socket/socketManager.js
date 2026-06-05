import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch { next(new Error('Invalid token')); }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (user: ${socket.userId})`);

    // Always join user room on connect — catches events even before task room join
    socket.join(`user:${socket.userId}`);

    socket.on('task:join', (taskId) => {
      socket.join(`task:${taskId}`);
      logger.debug(`User ${socket.userId} joined task:${taskId}`);
      // Confirm join so frontend knows it's ready
      socket.emit('task:joined', { taskId });
    });

    socket.on('task:leave', (taskId) => socket.leave(`task:${taskId}`));

    socket.on('ping', () => socket.emit('pong'));

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} — ${reason}`);
    });
  });

  return io;
};

export const getSocketIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
