import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { api } from './routes/index.js';
import { setupSocket } from './socket.js';
import { pool } from './db/pool.js';
import { migrate } from './db/migrate.js';
import { seedAdmin } from './db/seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT) || 3001;
const app = express();
const httpServer = createServer(app);

const io = setupSocket(httpServer);
app.locals.io = io;

app.use(helmet({ contentSecurityPolicy: false }));
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(
  cors({
    origin: corsOrigins.length > 1 ? corsOrigins : corsOrigins[0],
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    message: { error: 'Too many requests' },
  })
);
app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')));
app.use('/api', api);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function start(): Promise<void> {
  try {
    await pool.query('SELECT 1');
  } catch (e) {
    console.error('Database not available. Run PostgreSQL (e.g. docker-compose up -d postgres) and run migrations.');
    process.exit(1);
  }
  await migrate();
  await seedAdmin();

  httpServer.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
