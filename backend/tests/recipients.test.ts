import request from 'supertest';
import app from './app';
import prisma from '../src/config/database';

const unique = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe('Recipient API', () => {
  let createdId: string;

  afterAll(async () => {
    if (createdId) {
      await prisma.recipient.deleteMany({ where: { id: createdId } }).catch(() => {});
    }
  });

  it('POST /api/recipients — creates a recipient', async () => {
    const email = `${unique()}@test.com`;
    const res = await request(app).post('/api/recipients').send({
      email,
      name: 'Test User',
      phone: '+919999999999',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);
    expect(res.body.data.name).toBe('Test User');
    createdId = res.body.data.id;
  });

  it('GET /api/recipients — lists recipients', async () => {
    const res = await request(app).get('/api/recipients');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/recipients/:id — finds by id', async () => {
    const res = await request(app).get(`/api/recipients/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('GET /api/recipients/:id — 404 for missing', async () => {
    const res = await request(app).get('/api/recipients/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('PUT /api/recipients/:id — updates recipient', async () => {
    const res = await request(app).put(`/api/recipients/${createdId}`).send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated');
  });

  it('POST /api/recipients — rejects duplicate email', async () => {
    const email = `${unique()}@test.com`;
    await request(app).post('/api/recipients').send({ email });
    const res = await request(app).post('/api/recipients').send({ email });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/recipients/:id — deletes recipient', async () => {
    const createRes = await request(app).post('/api/recipients').send({
      email: `${unique()}@test.com`,
    });
    const id = createRes.body.data.id;
    const res = await request(app).delete(`/api/recipients/${id}`);
    expect(res.status).toBe(200);
  });
});
