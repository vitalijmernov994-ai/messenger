import { query } from '../db/pool.js';
import type { UserWithPassword } from '../types.js';

export const userRepository = {
  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const res = await query<UserWithPassword>(
      'SELECT id, email, password, name, role, created_at FROM users WHERE email = $1',
      [email]
    );
    return res.rows[0] ?? null;
  },

  async findById(id: string): Promise<UserWithPassword | null> {
    const res = await query<UserWithPassword>(
      'SELECT id, email, password, name, role, created_at, description, avatar_url FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] ?? null;
  },

  async findPublicById(id: string): Promise<{ id: string; name: string; email: string; description?: string | null; avatar_url?: string | null } | null> {
    const res = await query<{ id: string; name: string; email: string; description?: string | null; avatar_url?: string | null }>(
      'SELECT id, name, email, description, avatar_url FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] ?? null;
  },

  async create(
    email: string,
    hashedPassword: string,
    name: string,
    role: string
  ): Promise<string> {
    const res = await query<{ id: string }>(
      `INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [email, hashedPassword, name, role]
    );
    return res.rows[0].id;
  },

  async listExcept(userId: string): Promise<{ id: string; name: string; email: string }[]> {
    const res = await query<{ id: string; name: string; email: string }>(
      'SELECT id, name, email FROM users WHERE id != $1 ORDER BY name',
      [userId]
    );
    return res.rows;
  },

  async listAll(): Promise<{ id: string; email: string; name: string; role: string; created_at: Date; description?: string | null }[]> {
    const res = await query<{ id: string; email: string; name: string; role: string; created_at: Date; description?: string | null }>(
      'SELECT id, email, name, role, created_at, description FROM users ORDER BY created_at DESC'
    );
    return res.rows;
  },

  async update(id: string, data: { name?: string; email?: string; description?: string | null; avatar_url?: string | null }): Promise<void> {
    if (data.email !== undefined) {
      const existing = await query<{ id: string }>('SELECT id FROM users WHERE email = $1 AND id != $2', [data.email, id]);
      if (existing.rows[0]) throw new Error('EMAIL_TAKEN');
    }
    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    if (data.name !== undefined) {
      updates.push(`name = $${i++}`);
      values.push(data.name);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${i++}`);
      values.push(data.email);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${i++}`);
      values.push(data.description);
    }
    if (data.avatar_url !== undefined) {
      updates.push(`avatar_url = $${i++}`);
      values.push(data.avatar_url);
    }
    if (updates.length === 0) return;
    values.push(id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${i}`, values);
  },

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
  },
};
