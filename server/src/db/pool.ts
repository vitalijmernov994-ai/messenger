import pg from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://imsitchat:imsitchat_secret@localhost:5432/imsitchat';

export const pool = new pg.Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return pool.query(text, params) as Promise<pg.QueryResult<T>>;
}
