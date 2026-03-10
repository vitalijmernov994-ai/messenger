import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';
import { generatePublicId } from '../lib/publicId.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getSchemaPath(): string {
  const nextToMe = join(__dirname, 'schema.sql');
  const fromCwd = join(process.cwd(), 'src', 'db', 'schema.sql');
  if (existsSync(nextToMe)) return nextToMe;
  if (existsSync(fromCwd)) return fromCwd;
  return nextToMe;
}

export async function migrate(): Promise<void> {
  const schemaPath = getSchemaPath();
  const sql = readFileSync(schemaPath, 'utf-8');
  await pool.query(sql);
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS description TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT');
  await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url TEXT');
  await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type VARCHAR(20)');
  await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name TEXT');
  await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size INTEGER');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS banned_emails (
      email      VARCHAR(255) PRIMARY KEY,
      reason     TEXT,
      banned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      banned_by  UUID REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_banned_emails_at ON banned_emails(banned_at DESC)');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      contact_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      nickname    VARCHAR(255),
      local_photo TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (owner_id, contact_id)
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_id)');

  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS public_id VARCHAR(6)');
  const nullUsers = await pool.query<{ id: string }>('SELECT id FROM users WHERE public_id IS NULL');
  for (const row of nullUsers.rows) {
    let pid = '';
    for (let attempt = 0; attempt < 100; attempt++) {
      pid = generatePublicId();
      const conflict = await pool.query('SELECT 1 FROM users WHERE public_id = $1', [pid]);
      if (conflict.rowCount === 0) break;
    }
    await pool.query('UPDATE users SET public_id = $1 WHERE id = $2', [pid, row.id]);
  }
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_public_id ON users(public_id)');

  console.log('Migration completed.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
