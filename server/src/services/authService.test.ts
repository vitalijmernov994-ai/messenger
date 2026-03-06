import { authService } from './authService.js';

describe('authService', () => {
  describe('hashPassword', () => {
    it('returns a hash different from plain password', async () => {
      const hash = await authService.hashPassword('mypassword');
      expect(hash).not.toBe('mypassword');
      expect(hash.length).toBeGreaterThan(20);
    });

    it('produces different hashes for same password (salt)', async () => {
      const a = await authService.hashPassword('same');
      const b = await authService.hashPassword('same');
      expect(a).not.toBe(b);
    });
  });

  describe('comparePassword', () => {
    it('returns true for correct password', async () => {
      const hash = await authService.hashPassword('secret123');
      const ok = await authService.comparePassword('secret123', hash);
      expect(ok).toBe(true);
    });

    it('returns false for wrong password', async () => {
      const hash = await authService.hashPassword('secret123');
      const ok = await authService.comparePassword('wrong', hash);
      expect(ok).toBe(false);
    });
  });

  describe('createToken and verifyToken', () => {
    it('creates token and verify returns payload', () => {
      const user = {
        id: 'uuid-1',
        email: 'a@b.c',
        name: 'Test',
        role: 'user' as const,
        created_at: new Date(),
      };
      const token = authService.createToken(user);
      expect(typeof token).toBe('string');
      const payload = authService.verifyToken(token);
      expect(payload.userId).toBe(user.id);
      expect(payload.email).toBe(user.email);
      expect(payload.role).toBe('user');
    });
  });
});
