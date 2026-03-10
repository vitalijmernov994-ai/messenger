import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { dialogRepository } from './repositories/dialogRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export function setupSocket(httpServer: HttpServer): Server {
  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigins.length > 1 ? corsOrigins : corsOrigins[0],
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token ?? socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Auth required'));
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      (socket as unknown as { data: { userId: string } }).data = { userId: payload.userId };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as unknown as { data: { userId: string } }).data.userId;

    socket.on('join_dialog', async (dialogId: string, cb) => {
      const ok = await dialogRepository.isParticipant(dialogId, userId);
      if (!ok) return cb?.({ error: 'Forbidden' });
      socket.join(`dialog:${dialogId}`);
      cb?.({ ok: true });
    });

    socket.on('leave_dialog', (dialogId: string) => {
      socket.leave(`dialog:${dialogId}`);
    });
  });

  return io;
}

export function emitNewMessage(io: Server, dialogId: string, message: unknown): void {
  io.to(`dialog:${dialogId}`).emit('new_message', message);
}
