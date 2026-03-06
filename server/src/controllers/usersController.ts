import type { Request, Response } from 'express';
import { z } from 'zod';
import { userService } from '../services/userService.js';
import fs from 'fs';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
  description: z.string().max(500).optional().nullable(),
  avatar_url: z.union([z.string().url().max(2000), z.string().startsWith('/uploads/').max(500), z.literal('')]).optional().nullable().transform((v) => (v === '' ? undefined : v)),
});

export const usersController = {
  async list(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const list = await userService.listForDialog(userId);
    res.json(list);
  },

  async getProfile(req: Request, res: Response): Promise<void> {
    const targetId = req.params.id;
    if (!targetId) {
      res.status(400).json({ error: 'User id required' });
      return;
    }
    const profile = await userService.getPublicProfile(targetId);
    if (!profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(profile);
  },

  async uploadAvatar(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const avatarUrl = `/uploads/${req.file.filename}`;
    try {
      await userService.updateProfile(userId, { avatar_url: avatarUrl });
      res.json({ avatar_url: avatarUrl });
    } catch (e) {
      fs.unlink(req.file.path, () => {});
      throw e;
    }
  },

  async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    const data = parsed.data;
    if (data.name === undefined && data.email === undefined && data.description === undefined && data.avatar_url === undefined) {
      res.status(400).json({ error: 'Provide name, email, description or avatar_url to update' });
      return;
    }
    try {
      const user = await userService.updateProfile(userId, data);
      res.json(user);
    } catch (e) {
      if ((e as Error).message === 'EMAIL_TAKEN') {
        res.status(409).json({ error: 'This email is already used' });
        return;
      }
      throw e;
    }
  },
};
