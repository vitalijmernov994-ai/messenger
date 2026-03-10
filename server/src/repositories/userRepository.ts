import { query } from '../db/pool.js';
import type { UserWithPassword } from '../types.js';
import { generatePublicId } from '../lib/publicId.js';

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
      'SELECT id, email, password, name, role, created_at, description, avatar_url, public_id FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] ?? null;
  },

  async findPublicById(id: string): Promise<{ id: string; name: string; email: string; description?: string | null; avatar_url?: string | null; public_id?: string | null } | null> {
    const res = await query<{ id: string; name: string; email: string; description?: string | null; avatar_url?: string | null; public_id?: string | null }>(
      'SELECT id, name, email, description, avatar_url, public_id FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] ?? null;
  },

  async findByPublicId(publicId: string): Promise<{ id: string; name: string; public_id: string; avatar_url?: string | null } | null> {
    const res = await query<{ id: string; name: string; public_id: string; avatar_url?: string | null }>(
      'SELECT id, name, public_id, avatar_url FROM users WHERE public_id = $1',
      [publicId]
    );
    return res.rows[0] ?? null;
  },

  async create(
    email: string,
    hashedPassword: string,
    name: string,
    role: string
  ): Promise<string> {
    let publicId = '';
    for (let attempt = 0; attempt < 100; attempt++) {
      publicId = generatePublicId();
      const conflict = await query('SELECT 1 FROM users WHERE public_id = $1', [publicId]);
      if (conflict.rowCount === 0) break;
    }
    const res = await query<{ id: string }>(
      `INSERT INTO users (email, password, name, role, public_id) VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [email, hashedPassword, name, role, publicId]
    );
    return res.rows[0].id;
  },

  async listExcept(userId: string): Promise<{ id: string; name: string; public_id: string; avatar_url?: string | null }[]> {
    const res = await query<{ id: string; name: string; public_id: string; avatar_url?: string | null }>(
      'SELECT id, name, public_id, avatar_url FROM users WHERE id != $1 ORDER BY name',
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

  async listAllWithBanStatus(): Promise<{ id: string; email: string; name: string; role: string; created_at: Date; description?: string | null; is_banned: boolean }[]> {
    const res = await query<{ id: string; email: string; name: string; role: string; created_at: Date; description?: string | null; is_banned: boolean }>(
      `SELECT
         u.id, u.email, u.name, u.role, u.created_at, u.description,
         EXISTS(SELECT 1 FROM banned_emails b WHERE b.email = LOWER(u.email)) AS is_banned
       FROM users u
       ORDER BY u.created_at DESC`
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
