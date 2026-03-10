import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import type { JwtPayload } from '../types.js';
import { banRepository } from '../repositories/banRepository.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = header.slice(7);
  try {
    req.user = authService.verifyToken(token) as JwtPayload;
    const banned = await banRepository.isEmailBanned(req.user.email);
    if (banned) {
      res.status(403).json({ error: 'Email is banned' });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
