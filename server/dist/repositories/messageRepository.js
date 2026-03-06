import { query } from '../db/pool.js';
export const messageRepository = {
    async create(dialogId, senderId, body) {
        const res = await query('INSERT INTO messages (dialog_id, sender_id, body) VALUES ($1, $2, $3) RETURNING id, dialog_id, sender_id, body, created_at', [dialogId, senderId, body]);
        return res.rows[0];
    },
    async findByDialog(dialogId, limit = 100) {
        const res = await query(`SELECT m.id, m.dialog_id, m.sender_id, m.body, m.created_at,
              u.name AS sender_name, u.email AS sender_email
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.dialog_id = $1 ORDER BY m.created_at ASC LIMIT $2`, [dialogId, limit]);
        return res.rows;
    },
    async findById(id) {
        const res = await query(`SELECT m.id, m.dialog_id, m.sender_id, m.body, m.created_at,
              u.name AS sender_name, u.email AS sender_email
       FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = $1`, [id]);
        return res.rows[0] ?? null;
    },
};
