import request from 'supertest';
import app from './app';
import prisma from '../src/config/database';

const unique = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe('Preference API', () => {
  let recipientId: string;
  const email = `${unique()}@test.com`;

  beforeAll(async () => {
    const res = await request(app).post('/api/recipients').send({ email, name: 'Pref Test User' });
    recipientId = res.body.data.id;
  });

  afterAll(async () => {
    await prisma.userPreference.deleteMany({ where: { userId: recipientId } }).catch(() => {});
    await prisma.recipient.deleteMany({ where: { id: recipientId } }).catch(() => {});
  });

  it('POST /api/preferences — creates preference', async () => {
    const res = await request(app).post('/api/preferences').send({
      userId: recipientId,
      channel: 'email',
      optedIn: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.optedIn).toBe(true);
  });

  it('POST /api/preferences — rejects duplicate', async () => {
    const res = await request(app).post('/api/preferences').send({
      userId: recipientId,
      channel: 'email',
      optedIn: false,
    });
    expect(res.status).toBe(400);
  });

  it('GET /api/preferences/:userId/:channel — finds preference', async () => {
    const res = await request(app).get(`/api/preferences/${recipientId}/email`);
    expect(res.status).toBe(200);
    expect(res.body.data.optedIn).toBe(true);
  });

  it('GET /api/preferences/:userId — lists by user', async () => {
    const res = await request(app).get(`/api/preferences/${recipientId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('PUT /api/preferences/:userId/:channel — updates preference', async () => {
    const res = await request(app).put(`/api/preferences/${recipientId}/email`).send({ optedIn: false });
    expect(res.status).toBe(200);
    expect(res.body.data.optedIn).toBe(false);
  });

  it('DELETE /api/preferences/:userId/:channel — deletes preference', async () => {
    const res = await request(app).delete(`/api/preferences/${recipientId}/email`);
    expect(res.status).toBe(200);
  });
});
