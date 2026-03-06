import { pool } from './pool.js';
import { authService } from '../services/authService.js';
import { userRepository } from '../repositories/userRepository.js';

const ADMIN_EMAIL = 'admin@imsitchat.local';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Admin';

export async function seedAdmin(): Promise<void> {
  const existing = await userRepository.findByEmail(ADMIN_EMAIL);
  if (existing) return;
  const hash = await authService.hashPassword(ADMIN_PASSWORD);
  await userRepository.create(ADMIN_EMAIL, hash, ADMIN_NAME, 'admin');
  console.log('Seed: admin user created (admin@imsitchat.local / admin123)');
}
