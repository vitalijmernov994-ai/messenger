import { userRepository } from '../repositories/userRepository.js';
import type { User } from '../types.js';

export const userService = {
  async getById(id: string): Promise<User | null> {
    const row = await userRepository.findById(id);
    if (!row) return null;
    const r = row as { description?: string | null; avatar_url?: string | null };
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      description: r.description ?? null,
      avatar_url: r.avatar_url ?? null,
      role: row.role as User['role'],
      created_at: row.created_at,
    };
  },

  async getPublicProfile(id: string): Promise<{ id: string; name: string; email: string; description?: string | null; avatar_url?: string | null } | null> {
    return userRepository.findPublicById(id);
  },

  async listForDialog(exceptUserId: string): Promise<{ id: string; name: string; email: string }[]> {
    return userRepository.listExcept(exceptUserId);
  },

  async updateProfile(userId: string, data: { name?: string; email?: string; description?: string | null; avatar_url?: string | null }): Promise<User> {
    await userRepository.update(userId, data);
    const user = await this.getById(userId);
    if (!user) throw new Error('USER_NOT_FOUND');
    return user;
  },
};
