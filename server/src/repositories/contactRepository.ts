import { query } from '../db/pool.js';

export type ContactRow = {
  contact_id: string;
  name: string;
  avatar_url: string | null;
  nickname: string | null;
  local_photo: string | null;
  created_at: string;
};

export const contactRepository = {
  async list(ownerId: string): Promise<ContactRow[]> {
    const res = await query<ContactRow>(
      `SELECT c.contact_id, u.name, u.avatar_url, c.nickname, c.local_photo, c.created_at
       FROM contacts c
       JOIN users u ON u.id = c.contact_id
       WHERE c.owner_id = $1
       ORDER BY c.created_at DESC`,
      [ownerId]
    );
    return res.rows;
  },

  async add(ownerId: string, contactId: string): Promise<void> {
    await query(
      `INSERT INTO contacts (owner_id, contact_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [ownerId, contactId]
    );
  },

  async remove(ownerId: string, contactId: string): Promise<void> {
    await query(
      `DELETE FROM contacts WHERE owner_id = $1 AND contact_id = $2`,
      [ownerId, contactId]
    );
  },

  async update(ownerId: string, contactId: string, data: { nickname?: string | null; local_photo?: string | null }): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (data.nickname !== undefined) { fields.push(`nickname = $${idx++}`); values.push(data.nickname); }
    if (data.local_photo !== undefined) { fields.push(`local_photo = $${idx++}`); values.push(data.local_photo); }
    if (!fields.length) return;
    values.push(ownerId, contactId);
    await query(
      `UPDATE contacts SET ${fields.join(', ')} WHERE owner_id = $${idx++} AND contact_id = $${idx}`,
      values
    );
  },

  async exists(ownerId: string, contactId: string): Promise<boolean> {
    const res = await query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM contacts WHERE owner_id = $1 AND contact_id = $2) AS exists`,
      [ownerId, contactId]
    );
    return res.rows[0]?.exists ?? false;
  },
};
