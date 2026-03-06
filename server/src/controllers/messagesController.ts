import type { Request, Response } from 'express';
import type { Server } from 'socket.io';
import { z } from 'zod';
import { messageService } from '../services/messageService.js';
import { emitNewMessage } from '../socket.js';

const sendSchema = z.object({ body: z.string().min(1).max(10000) });

export const messagesController = {
  async list(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const dialogId = req.params.dialogId;
    if (!dialogId) {
      res.status(400).json({ error: 'dialogId required' });
      return;
    }
    try {
      const messages = await messageService.getByDialog(dialogId, userId);
      res.json(messages);
    } catch (e) {
      if ((e as Error).message === 'FORBIDDEN') {
        res.status(403).json({ error: 'Access denied to this dialog' });
        return;
      }
      throw e;
    }
  },

  async send(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const dialogId = req.params.dialogId;
    if (!dialogId) {
      res.status(400).json({ error: 'dialogId required' });
      return;
    }
    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    try {
      const message = await messageService.send(dialogId, userId, parsed.data.body);
      const io = (req.app as { locals?: { io?: Server } }).locals?.io;
      if (io) emitNewMessage(io, dialogId, message);
      res.status(201).json(message);
    } catch (e) {
      if ((e as Error).message === 'FORBIDDEN') {
        res.status(403).json({ error: 'Access denied to this dialog' });
        return;
      }
      throw e;
    }
  },
};
