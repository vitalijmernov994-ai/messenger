import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
function getSchemaPath() {
    const nextToMe = join(__dirname, 'schema.sql');
    const fromCwd = join(process.cwd(), 'src', 'db', 'schema.sql');
    if (existsSync(nextToMe))
        return nextToMe;
    if (existsSync(fromCwd))
        return fromCwd;
    return nextToMe;
}
export async function migrate() {
    const schemaPath = getSchemaPath();
    const sql = readFileSync(schemaPath, 'utf-8');
    await pool.query(sql);
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS description TEXT');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT');
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
