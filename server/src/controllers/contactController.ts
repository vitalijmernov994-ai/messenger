import type { Request, Response } from 'express';
import { z } from 'zod';
import { contactRepository } from '../repositories/contactRepository.js';

export const contactController = {
  async list(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const contacts = await contactRepository.list(userId);
    res.json(contacts);
  },

  async add(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const schema = z.object({ contactId: z.string().uuid() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'contactId required' }); return; }
    const { contactId } = parsed.data;
    if (contactId === userId) { res.status(400).json({ error: 'Cannot add yourself' }); return; }
    await contactRepository.add(userId, contactId);
    res.json({ ok: true });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { contactId } = req.params;
    if (!contactId) { res.status(400).json({ error: 'contactId required' }); return; }
    await contactRepository.remove(userId, contactId);
    res.json({ ok: true });
  },

  async update(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { contactId } = req.params;
    const schema = z.object({
      nickname: z.string().max(100).nullable().optional(),
      local_photo: z.string().max(2000).nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Invalid data' }); return; }
    await contactRepository.update(userId, contactId, parsed.data);
    res.json({ ok: true });
  },

  async check(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { contactId } = req.params;
    const row = await contactRepository.getOne(userId, contactId);
    res.json({ isContact: !!row, nickname: row?.nickname ?? null, local_photo: row?.local_photo ?? null });
  },
};
