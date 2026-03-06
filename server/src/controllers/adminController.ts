import type { Request, Response } from 'express';
import { userRepository } from '../repositories/userRepository.js';

export const adminController = {
  async listUsers(req: Request, res: Response): Promise<void> {
    const users = await userRepository.listAll();
    res.json(users);
  },
};
