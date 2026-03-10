import { query } from '../db/pool.js';
import type { Message, MessageWithSender } from '../types.js';

export const messageRepository = {
  async create(
    dialogId: string,
    senderId: string,
    body: string,
    file?: { url: string; type: string | null; name: string | null; size: number | null }
  ): Promise<Message> {
    const res = await query<Message>(
      `INSERT INTO messages (dialog_id, sender_id, body, file_url, file_type, file_name, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, dialog_id, sender_id, body, created_at, file_url, file_type, file_name, file_size`,
      [
        dialogId,
        senderId,
        body,
        file?.url ?? null,
        file?.type ?? null,
        file?.name ?? null,
        file?.size ?? null,
      ]
    );
    return res.rows[0];
  },

  async findByDialog(dialogId: string, limit = 100): Promise<MessageWithSender[]> {
    const res = await query<MessageWithSender>(
      `SELECT m.id, m.dialog_id, m.sender_id, m.body, m.created_at,
              m.file_url, m.file_type, m.file_name, m.file_size,
              u.name AS sender_name, u.email AS sender_email, u.avatar_url AS sender_avatar_url
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.dialog_id = $1 ORDER BY m.created_at ASC LIMIT $2`,
      [dialogId, limit]
    );
    return res.rows;
  },

  async findById(id: string): Promise<MessageWithSender | null> {
    const res = await query<MessageWithSender>(
      `SELECT m.id, m.dialog_id, m.sender_id, m.body, m.created_at,
              m.file_url, m.file_type, m.file_name, m.file_size,
              u.name AS sender_name, u.email AS sender_email, u.avatar_url AS sender_avatar_url
       FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = $1`,
      [id]
    );
    return res.rows[0] ?? null;
  },
};
