/**
 * Интеграционные тесты API.
 * Требуют запущенной БД (docker-compose up -d postgres) и выполненной миграции.
 * Запуск: npm test (из папки server)
 */
import request from 'supertest';
import express from 'express';
import { api } from '../routes/index.js';
import { pool } from '../db/pool.js';
import { migrate } from '../db/migrate.js';

const app = express();
app.use(express.json());
app.use('/api', api);

describe('API integration', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('POST /api/auth/register creates user and returns token', async () => {
    const email = `test-${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Test User' })
      .expect(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email, name: 'Test User', role: 'user' });
  });

  it('POST /api/auth/login returns token for valid credentials', async () => {
    const email = `login-${Date.now()}@example.com`;
    await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'secret456', name: 'Login User' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'secret456' })
      .expect(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(email);
  });
});
