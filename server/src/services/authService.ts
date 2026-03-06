import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository.js';
import type { User, UserRole } from '../types.js';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES = '7d';

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  async register(
    email: string,
    password: string,
    name: string,
    role: UserRole = 'user'
  ): Promise<{ user: User; token: string }> {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new Error('USER_EXISTS');
    const hashed = await this.hashPassword(password);
    const id = await userRepository.create(email, hashed, name, role);
    const user: User = {
      id,
      email,
      name,
      role,
      created_at: new Date(),
    };
    const token = this.createToken(user);
    return { user, token };
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const found = await userRepository.findByEmail(email);
    if (!found) throw new Error('INVALID_CREDENTIALS');
    const ok = await this.comparePassword(password, found.password);
    if (!ok) throw new Error('INVALID_CREDENTIALS');
    const user: User = {
      id: found.id,
      email: found.email,
      name: found.name,
      role: found.role as UserRole,
      created_at: found.created_at,
    };
    const token = this.createToken(user);
    return { user, token };
  },

  createToken(user: User): string {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
  },

  verifyToken(token: string): { userId: string; email: string; role: UserRole } {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: UserRole;
    };
    return payload;
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('USER_NOT_FOUND');
    const ok = await this.comparePassword(currentPassword, user.password);
    if (!ok) throw new Error('INVALID_PASSWORD');
    const hashed = await this.hashPassword(newPassword);
    await userRepository.updatePassword(userId, hashed);
  },
};
