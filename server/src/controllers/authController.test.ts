import { jest } from '@jest/globals';
import { authController } from './authController.js';

describe('authController', () => {
  describe('register validation', () => {
    it('rejects empty body', async () => {
      const req = { body: {} } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects invalid email', async () => {
      const req = {
        body: { email: 'not-email', password: '123456', name: 'Test' },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      await authController.register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
