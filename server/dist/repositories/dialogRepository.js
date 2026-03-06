import { query } from '../db/pool.js';
export const dialogRepository = {
    async create() {
        const res = await query('INSERT INTO dialogs DEFAULT VALUES RETURNING id');
        return res.rows[0].id;
    },
    async addParticipant(dialogId, userId) {
        await query('INSERT INTO dialog_participants (dialog_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [dialogId, userId]);
    },
    async findOrCreatePersonalDialog(userId1, userId2) {
        const existing = await query(`SELECT d.id AS dialog_id FROM dialogs d
       INNER JOIN dialog_participants dp1 ON dp1.dialog_id = d.id AND dp1.user_id = $1
       INNER JOIN dialog_participants dp2 ON dp2.dialog_id = d.id AND dp2.user_id = $2`, [userId1, userId2]);
        if (existing.rows[0])
            return existing.rows[0].dialog_id;
        const dialogId = await this.create();
        await this.addParticipant(dialogId, userId1);
        await this.addParticipant(dialogId, userId2);
        return dialogId;
    },
    async findForUser(userId) {
        const res = await query(`SELECT d.id, d.created_at FROM dialogs d
       INNER JOIN dialog_participants dp ON dp.dialog_id = d.id
       WHERE dp.user_id = $1 ORDER BY d.created_at DESC`, [userId]);
        return res.rows;
    },
    async isParticipant(dialogId, userId) {
        const res = await query('SELECT COUNT(*)::text AS count FROM dialog_participants WHERE dialog_id = $1 AND user_id = $2', [dialogId, userId]);
        return res.rows[0]?.count === '1';
    },
    async getOtherParticipant(dialogId, userId) {
        const res = await query(`SELECT u.id, u.name, u.email FROM users u
       INNER JOIN dialog_participants dp ON dp.user_id = u.id
       WHERE dp.dialog_id = $1 AND u.id != $2`, [dialogId, userId]);
        return res.rows[0] ?? null;
    },
};
