import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

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
