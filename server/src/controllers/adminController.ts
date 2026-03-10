import type { Request, Response } from 'express';
import { userRepository } from '../repositories/userRepository.js';
import { banRepository } from '../repositories/banRepository.js';

export const adminController = {
  async listUsers(req: Request, res: Response): Promise<void> {
    const users = await userRepository.listAllWithBanStatus();
    res.json(users);
  },

  async listBanned(req: Request, res: Response): Promise<void> {
    const bans = await banRepository.listBans();
    res.json(bans);
  },

  async banEmail(req: Request, res: Response): Promise<void> {
    const email = String((req.body as any)?.email ?? '').trim();
    const reasonRaw = (req.body as any)?.reason;
    const reason = reasonRaw === undefined ? null : (reasonRaw === null ? null : String(reasonRaw).trim() || null);
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    await banRepository.upsertBan(email, reason, req.user?.userId ?? null);
    res.json({ ok: true });
  },

  async unbanEmail(req: Request, res: Response): Promise<void> {
    const email = decodeURIComponent(String(req.params.email ?? '')).trim();
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    await banRepository.removeBan(email);
    res.json({ ok: true });
  },
};
