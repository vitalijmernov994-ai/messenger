import type { Request, Response } from 'express';
import type { Server } from 'socket.io';
import { z } from 'zod';
import { messageService } from '../services/messageService.js';
import { emitNewMessage } from '../socket.js';

const sendSchema = z.object({ body: z.string().min(1).max(10000) });
const sendMediaSchema = z.object({ body: z.string().max(10000).optional().default('') });

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

  async sendMedia(req: Request, res: Response): Promise<void> {
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
    if (!req.file) {
      res.status(400).json({ error: 'File is required' });
      return;
    }
    const parsed = sendMediaSchema.safeParse({ body: (req.body as any)?.body });
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const mime = req.file.mimetype || '';
    let type: string | null = null;
    if (mime.startsWith('image/')) type = 'image';
    else if (mime.startsWith('video/')) type = 'video';
    else if (mime.startsWith('audio/')) type = 'audio';
    else type = 'file';

    try {
      const message = await messageService.sendWithFile(dialogId, userId, parsed.data.body ?? '', {
        url: fileUrl,
        type,
        name: req.file.originalname || null,
        size: typeof req.file.size === 'number' ? req.file.size : null,
      });
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
