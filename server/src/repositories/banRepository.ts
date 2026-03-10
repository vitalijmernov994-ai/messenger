import { query } from '../db/pool.js';

export type BanRow = {
  email: string;
  reason: string | null;
  banned_at: Date;
  banned_by: string | null;
  user_id: string | null;
  user_name: string | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const banRepository = {
  normalizeEmail,

  async isEmailBanned(email: string): Promise<boolean> {
    const e = normalizeEmail(email);
    const res = await query('SELECT 1 FROM banned_emails WHERE email = $1', [e]);
    return (res.rowCount ?? 0) > 0;
  },

  async upsertBan(email: string, reason: string | null, bannedByUserId: string | null): Promise<void> {
    const e = normalizeEmail(email);
    await query(
      `INSERT INTO banned_emails (email, reason, banned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET
         reason = EXCLUDED.reason,
         banned_by = EXCLUDED.banned_by,
         banned_at = NOW()`,
      [e, reason, bannedByUserId]
    );
  },

  async removeBan(email: string): Promise<void> {
    const e = normalizeEmail(email);
    await query('DELETE FROM banned_emails WHERE email = $1', [e]);
  },

  async listBans(): Promise<BanRow[]> {
    const res = await query<BanRow>(
      `SELECT
         b.email,
         b.reason,
         b.banned_at,
         b.banned_by,
         u.id as user_id,
         u.name as user_name
       FROM banned_emails b
       LEFT JOIN users u ON u.email = b.email
       ORDER BY b.banned_at DESC`
    );
    return res.rows;
  },
};

