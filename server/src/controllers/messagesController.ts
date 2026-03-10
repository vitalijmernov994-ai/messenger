import type { Request, Response } from 'express';
import type { Server } from 'socket.io';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { messageService } from '../services/messageService.js';
import { emitNewMessage } from '../socket.js';

const sendSchema = z.object({ body: z.string().min(1).max(10000) });
const sendMediaSchema = z.object({ body: z.string().max(10000).optional().default('') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(process.cwd(), 'uploads');

async function transcodeToMp3IfNeeded(
  absPath: string,
  originalMime: string
): Promise<{ url: string; type: string | null; name: string | null; size: number | null }> {
  const isWebmLike = originalMime.startsWith('video/webm') || originalMime.startsWith('audio/webm');
  if (!isWebmLike) {
    const stat = await fs.promises.stat(absPath).catch(() => null);
    return {
      url: `/uploads/${path.basename(absPath)}`,
      type: originalMime.startsWith('audio/') ? 'audio' : originalMime.startsWith('video/') ? 'video' : 'file',
      name: path.basename(absPath),
      size: stat ? stat.size : null,
    };
  }

  const base = path.basename(absPath, path.extname(absPath));
  const target = path.join(uploadsDir, `${base}.mp3`);

  await new Promise<void>((resolve, reject) => {
    const ff = spawn('ffmpeg', ['-y', '-i', absPath, '-vn', '-acodec', 'libmp3lame', target]);
    ff.on('error', reject);
    ff.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  }).catch(() => {});

  const stat = await fs.promises.stat(target).catch(() => null);
  if (stat) {
    // Опционально можно удалить оригинал
    fs.promises.unlink(absPath).catch(() => {});
    return {
      url: `/uploads/${path.basename(target)}`,
      type: 'audio',
      name: `${base}.mp3`,
      size: stat.size,
    };
  }

  const fallbackStat = await fs.promises.stat(absPath).catch(() => null);
  return {
    url: `/uploads/${path.basename(absPath)}`,
    type: 'audio',
    name: path.basename(absPath),
    size: fallbackStat ? fallbackStat.size : null,
  };
}

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

    const mime = req.file.mimetype || '';
    const absPath = path.join(uploadsDir, req.file.filename);

    let fileMeta: { url: string; type: string | null; name: string | null; size: number | null };
    if (mime.startsWith('audio/') || mime.startsWith('video/webm')) {
      fileMeta = await transcodeToMp3IfNeeded(absPath, mime);
    } else {
      const stat = await fs.promises.stat(absPath).catch(() => null);
      let type: string | null = null;
      if (mime.startsWith('image/')) type = 'image';
      else if (mime.startsWith('video/')) type = 'video';
      else if (mime.startsWith('audio/')) type = 'audio';
      else type = 'file';
      fileMeta = {
        url: `/uploads/${req.file.filename}`,
        type,
        name: req.file.originalname || null,
        size: stat ? stat.size : null,
      };
    }

    try {
      const message = await messageService.sendWithFile(dialogId, userId, parsed.data.body ?? '', fileMeta);
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
